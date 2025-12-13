// GLOBAL LOGGER (works everywhere)
window.Logger = {
  log: function(action, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("app_logs") || "[]");
    existing.push(logEntry);
    localStorage.setItem("app_logs", JSON.stringify(existing));

    console.log("[LOG]", logEntry.timestamp, "-", action, "-", details);
  },

  getLogs: function() {
    return JSON.parse(localStorage.getItem("app_logs") || "[]");
  },

  clear: function() {
    localStorage.removeItem("app_logs");
  },

  action: function(action, details = {}) {
    this.log(action, details);
  }
};

// Make GlobalLogger point to Logger for Firebase/UI files
window.GlobalLogger = window.Logger;