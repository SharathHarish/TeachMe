function autoLogUI() {
  // Page load log
  GlobalLogger.log("PAGE_LOADED", { url: window.location.href });

  // Log all clicks
  document.addEventListener("click", (e) => {
    GlobalLogger.log("UI_CLICK", {
      tag: e.target.tagName,
      id: e.target.id || null,
      class: e.target.className || null,
      text: e.target.innerText?.substring(0, 40) || "",
    });
  });

  // Log input typing
  document.addEventListener("input", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      GlobalLogger.log("UI_INPUT", {
        id: e.target.id || null,
        name: e.target.name || null
      });
    }
  });
}

autoLogUI();
