/* ============================================================
   ai.js —— AI 请求核心
   作用：双协议 SSE 流式请求 + 结构化累积
   机制：按 conf.protocol分支构造请求；统一 SSE 解析
         超时统一包装为 TimeoutError
   加载：依赖 core.js
   ============================================================ */
(function (App) {
  "use strict";


  /* ============================================================
     J20 AI 流式请求核心
     作用：双协议 SSE 流式请求 + 结构化累积
     ============================================================ */
  /* 反查工具名：Gemini functionResponse 需要 name */
  App.findToolCallName = function (msgs, toolCallId) {
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      if (m.role === "assistant" && m.tool_calls) {
        for (var j = 0; j < m.tool_calls.length; j++) {
          if (m.tool_calls[j].id === toolCallId) {
            return m.tool_calls[j].function.name;
          }
        }
      }
    }
    return "unknown";
  };
  /* 内部消息 → Gemini contents（含多模态 inlineData） */
  App.convertToGeminiMessages = function (internalMsgs) {
    var systemInstruction = null;
    var contents = [];
    for (var i = 0; i < internalMsgs.length; i++) {
      var m = internalMsgs[i];
      if (m.role === "system") {
        systemInstruction = { parts: [{ text: m.content || "" }] };
      } else if (m.role === "user") {
        /* 多模态：content 为数组时含 text / image_url */
        if (Array.isArray(m.content)) {
          var uParts = [];
          m.content.forEach(function (c) {
            if (!c) return;
            if (c.type === "text") {
              uParts.push({ text: c.text || "" });
            } else if (
              c.type === "image_url" &&
              c.image_url &&
              c.image_url.url
            ) {
              var match = /^data:([^;]+);base64,(.+)$/.exec(c.image_url.url);
              if (match) {
                uParts.push({
                  inlineData: { mimeType: match[1], data: match[2] },
                });
              }
            }
          });
          contents.push({ role: "user", parts: uParts });
        } else {
          contents.push({
            role: "user",
            parts: [{ text: m.content || "" }],
          });
        }
      } else if (m.role === "assistant") {
        if (m.tool_calls && m.tool_calls.length) {
          var parts = [];
          m.tool_calls.forEach(function (tc) {
            var argsObj = {};
            try {
              argsObj =
                typeof tc.function.arguments === "string"
                  ? JSON.parse(tc.function.arguments)
                  : tc.function.arguments || {};
            } catch (e) {
              argsObj = {};
            }
            parts.push({
              functionCall: { name: tc.function.name, args: argsObj },
            });
          });
          contents.push({ role: "model", parts: parts });
        } else {
          contents.push({
            role: "model",
            parts: [{ text: m.content || "" }],
          });
        }
      } else if (m.role === "tool") {
        var tcName = App.findToolCallName(internalMsgs, m.tool_call_id);
        contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: tcName,
                response: { result: m.content || "" },
              },
            },
          ],
        });
      }
    }
    return { systemInstruction: systemInstruction, contents: contents };
  };
  /* 统一流式请求：对象参数 */
  App.streamAI = function (opts) {
    var model = opts.model;
    var key = opts.key;
    var messages = opts.messages;
    var systemPrompt = opts.systemPrompt;
    var onDelta = opts.onDelta;
    var onRaw = opts.onRaw;
    var enableTools = !!opts.tools;
    var extSignal = opts.signal || null;

    var conf = App.aiModelConf(model);
    var url, options;
    /* Gemini 分支 */
    if (conf.protocol === "gemini") {
      var conv = App.convertToGeminiMessages(messages);
      var body = { contents: conv.contents };
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      } else if (conv.systemInstruction) {
        body.systemInstruction = conv.systemInstruction;
      }
      if (enableTools) body.tools = App.buildGeminiTools();
      url =
        conf.endpoint.replace(":generateContent", ":streamGenerateContent") +
        "?alt=sse&key=" +
        encodeURIComponent(key);
      options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    } else {
      /* OpenAI 兼容分支 */
      var msgs = [];
      if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
      messages.forEach(function (m) {
        msgs.push(m);
      });
      url = conf.endpoint;
      var reqBody = {
        model: conf.apiModel,
        messages: msgs,
        stream: true,
        stream_options: { include_usage: true },
      };
      if (enableTools) reqBody.tools = App.buildOpenAITools();
      options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify(reqBody),
      };
    }
    /* 超时控制：内部 60s；超时时抛 TimeoutError */
    var timeoutCtl = new AbortController();
    var timedOut = false;
    var timeoutId = setTimeout(function () {
      timedOut = true;
      try {
        timeoutCtl.abort();
      } catch (e) {}
    }, App.settings.REQUEST_TIMEOUT_MS);

    /* signal 合并：外部 signal 优先，否则用全局；都与超时合并 */
    var baseSignal = extSignal;
    if (!baseSignal && App.aiState.abortController) {
      baseSignal = App.aiState.abortController.signal;
    }
    if (baseSignal) {
      var combined = new AbortController();
      var onAbort = function () {
        try {
          combined.abort();
        } catch (e) {}
      };
      baseSignal.addEventListener("abort", onAbort);
      timeoutCtl.signal.addEventListener("abort", onAbort);
      options.signal = combined.signal;
    } else {
      options.signal = timeoutCtl.signal;
    }
    /* fetch + SSE 解析 */
    return fetch(url, options)
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            var msg = "HTTP " + res.status;
            try {
              var d = JSON.parse(t);
              msg =
                (d.error && d.error.message) ||
                d.message ||
                (d.error && d.error.status) ||
                msg;
            } catch (e) {}
            throw new Error(msg);
          });
        }
        if (!res.body || !res.body.getReader) {
          throw new Error(App.T("chat.errStreamUnsupported"));
        }
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buffer = "";
        /* 单条 data: 派发 */
        function dispatchData(data) {
          if (!data) return;
          if (data === "[DONE]") {
            if (onRaw) onRaw("[DONE]");
            return;
          }
          try {
            var obj = JSON.parse(data);
            if (onRaw) onRaw(obj);
            onDelta(obj);
          } catch (e) {}
        }
        /* 缓冲区解析：按 \n\n 分 SSE 事件 */
        function processBuffer(flush) {
          if (buffer.indexOf("\r") !== -1) {
            buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
          }
          var sepIndex;
          while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
            var evt = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);
            var lines = evt.split("\n");
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (line.indexOf("data:") === 0) {
                dispatchData(line.slice(5).trim());
              }
            }
          }
          if (flush && buffer.trim()) {
            var tail = buffer.trim();
            if (tail.indexOf("data:") === 0) {
              dispatchData(tail.slice(5).trim());
            }
            buffer = "";
          }
        }
        /* 递归读取流 */
        function pump() {
          return reader.read().then(function (result) {
            if (result.done) {
              processBuffer(true);
              return;
            }
            buffer += decoder.decode(result.value, { stream: true });
            processBuffer(false);
            return pump();
          });
        }
        return pump();
      })
      .catch(function (err) {
        /* 超时统一包装为 TimeoutError */
        if (timedOut) {
          var e = new Error("REQUEST_TIMEOUT");
          e.name = "TimeoutError";
          throw e;
        }
        throw err;
      })
      .finally(function () {
        clearTimeout(timeoutId);
      });
  };
  /* 结构化累积器：id / usage / finish_reason / tool_calls */
  App.createStructuredAccumulator = function () {
    var meta = {
      id: null,
      model: null,
      created: null,
      finish_reason: null,
      usage: null,
      tool_calls: null,
    };
    var tcBuf = {};
    var hasToolCall = false;
    /* 逐 chunk 累积 */
    function consume(obj) {
      if (!obj || obj === "[DONE]") return;
      if (obj.id && !meta.id) meta.id = obj.id;
      if (obj.model && !meta.model) meta.model = obj.model;
      if (obj.created && !meta.created) meta.created = obj.created;
      if (obj.usage) meta.usage = obj.usage;
      /* OpenAI：delta.tool_calls 拼接 */
      var ch = obj.choices && obj.choices[0];
      if (ch) {
        if (ch.finish_reason) meta.finish_reason = ch.finish_reason;
        var delta = ch.delta || {};
        var tcs = delta.tool_calls;
        if (tcs && tcs.length) {
          hasToolCall = true;
          tcs.forEach(function (t) {
            var idx = t.index != null ? t.index : 0;
            if (!tcBuf[idx]) {
              tcBuf[idx] = {
                id: "",
                type: "function",
                function: { name: "", arguments: "" },
              };
            }
            var buf = tcBuf[idx];
            if (t.id) buf.id = t.id;
            if (t.type) buf.type = t.type;
            if (t.function) {
              if (t.function.name) buf.function.name += t.function.name;
              if (t.function.arguments)
                buf.function.arguments += t.function.arguments;
            }
          });
        }
      }
      /* Gemini：candidates[0].content.parts[].functionCall */
      var cand = obj.candidates && obj.candidates[0];
      if (cand) {
        if (cand.finishReason && !meta.finish_reason) {
          meta.finish_reason = cand.finishReason;
        }
        if (cand.content && cand.content.parts) {
          cand.content.parts.forEach(function (p) {
            if (p.functionCall) {
              hasToolCall = true;
              var idx = Object.keys(tcBuf).length;
              tcBuf[idx] = {
                id: "call_" + Date.now() + "_" + idx,
                type: "function",
                function: {
                  name: p.functionCall.name || "",
                  arguments: JSON.stringify(p.functionCall.args || {}),
                },
              };
            }
          });
        }
      }
      /* Gemini usageMetadata 映射 */
      if (obj.usageMetadata) {
        meta.usage = {
          prompt_tokens: obj.usageMetadata.promptTokenCount,
          completion_tokens: obj.usageMetadata.candidatesTokenCount,
          total_tokens: obj.usageMetadata.totalTokenCount,
        };
      }
    }
    /* 结束：整理 tool_calls 数组 */
    function finalize() {
      if (hasToolCall) {
        var arr = [];
        Object.keys(tcBuf)
          .sort(function (a, b) {
            return a - b;
          })
          .forEach(function (k) {
            var t = tcBuf[k];
            if (t.function && t.function.name) arr.push(t);
          });
        if (arr.length) meta.tool_calls = arr;
      }
      return meta;
    }
    return { consume: consume, finalize: finalize };
  };

})(window.App);