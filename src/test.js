const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dl = new THREE.DirectionalLight(0xffffff, 1);
dl.position.set(3, 4, 5);
scene.add(dl);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.MeshStandardMaterial({ color: 0x44aaff, metalness: 0.3, roughness: 0.4 })
);
scene.add(cube);
cube.add(new THREE.LineSegments(
  new THREE.EdgesGeometry(cube.geometry),
  new THREE.LineBasicMaterial({ color: 0xffffff })
));

// ===== 相机状态 =====
let rotX = 0, rotY = 0;
let dist = 5;
let panX = 0, panY = 0;

// ===== 触摸追踪 =====
const touches = new Map();
let lastPinchDist = 0;
let lastMidX = 0, lastMidY = 0;
let isDragging = false;

const el = renderer.domElement;
el.style.touchAction = "none";

function pts() { return [...touches.values()]; }

function onTouchStart(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    const t = e.changedTouches[i];
    touches.set(t.identifier, { x: t.clientX, y: t.clientY });
  }
  const p = pts();
  if (p.length === 1) {
    isDragging = true;
    lastPinchDist = 0;
  } else if (p.length === 2) {
    isDragging = false;
    const [a, b] = p;
    lastPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    lastMidX = (a.x + b.x) / 2;
    lastMidY = (a.y + b.y) / 2;
  }
}

function onTouchMove(e) {
  e.preventDefault();
  const p = pts();

  if (p.length === 1 && isDragging) {
    const t = e.changedTouches[0];
    const prev = touches.get(t.identifier);
    if (prev) {
      const dx = t.clientX - prev.x;
      const dy = t.clientY - prev.y;
      rotY += dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, rotX));
      touches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
  } else if (p.length === 2) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (touches.has(t.identifier)) {
        touches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
    }
    const [a, b] = pts();
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (lastPinchDist > 0) {
      const ratio = lastPinchDist / d;
      dist *= ratio;
      dist = Math.max(2, Math.min(20, dist));
    }
    lastPinchDist = d;

    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    panX += (midX - lastMidX) * 0.01;
    panY -= (midY - lastMidY) * 0.01;
    lastMidX = midX;
    lastMidY = midY;
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  for (let i = 0; i < e.changedTouches.length; i++) {
    touches.delete(e.changedTouches[i].identifier);
  }
  const p = pts();
  if (p.length === 1) {
    isDragging = true;
    lastPinchDist = 0;
  } else if (p.length === 0) {
    isDragging = false;
    lastPinchDist = 0;
  }
}

el.addEventListener("touchstart", onTouchStart, { passive: false });
el.addEventListener("touchmove", onTouchMove, { passive: false });
el.addEventListener("touchend", onTouchEnd, { passive: false });
el.addEventListener("touchcancel", onTouchEnd, { passive: false });

// ===== 桌面鼠标兼容 =====
let mouseDown = false;
let lastMX = 0, lastMY = 0;
el.addEventListener("mousedown", (e) => {
  mouseDown = true;
  lastMX = e.clientX;
  lastMY = e.clientY;
});
el.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  const dx = e.clientX - lastMX;
  const dy = e.clientY - lastMY;
  rotY += dx * 0.005;
  rotX += dy * 0.005;
  rotX = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, rotX));
  lastMX = e.clientX;
  lastMY = e.clientY;
});
el.addEventListener("mouseup", () => { mouseDown = false; });
el.addEventListener("mouseleave", () => { mouseDown = false; });
el.addEventListener("wheel", (e) => {
  e.preventDefault();
  dist *= 1 + e.deltaY * 0.001;
  dist = Math.max(2, Math.min(20, dist));
}, { passive: false });

// ===== 动画循环 =====
renderer.setAnimationLoop(() => {
  cube.rotation.x += 0.005;
  cube.rotation.y += 0.008;

  camera.position.x = Math.sin(rotY) * Math.cos(rotX) * dist + panX;
  camera.position.y = Math.sin(rotX) * dist + panY;
  camera.position.z = Math.cos(rotY) * Math.cos(rotX) * dist;
  camera.lookAt(panX, panY, 0);

  renderer.render(scene, camera);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});