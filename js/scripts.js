(function () {
  var observer;
  var images = [].slice.call(document.querySelectorAll(".and-list__image"));
  var loadImage = function (elem) {
    var src = elem.getAttribute("data-src");
    if (!src) return;
    var image = new Image();
    image.onload = function () {
      elem.style.backgroundImage = "url(" + src + ")";
      elem.className += " and-list__image--loaded";
    };
    image.src = src;
  };
  if (!("IntersectionObserver" in window)) {
    images.forEach(function (image) {
      loadImage(image);
    });
  } else {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio > 0) {
          observer.unobserve(entry.target);
          loadImage(entry.target);
        }
      });
    }, {
      rootMargin: "50px 0px",
      threshold: 0.01
    });
    images.forEach(function (image) {
      observer.observe(image);
    });
  }
})();