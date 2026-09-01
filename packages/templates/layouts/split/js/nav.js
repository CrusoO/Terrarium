(function () {
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!file.includes(".")) file = "index.html";
  document.querySelectorAll(".site-nav a").forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (href === file || (file === "index.html" && href === "index.html")) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
})();
