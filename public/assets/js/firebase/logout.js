import { auth } from "../firebase/firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

function attachLogoutHandler() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return; // No button? do nothing

  // Prevent multiple bindings
  if (logoutBtn.dataset.bound) return;
  logoutBtn.dataset.bound = "true";

  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault(); // just in case, prevents default action

    try {
      // Firebase logout
      await signOut(auth);

      // Clear session / local storage
      sessionStorage.clear();
      localStorage.clear();

      // Redirect to login
      window.location.replace("../login.html");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Try again.");
    }
  });
}

// Attach after DOM ready
document.addEventListener("DOMContentLoaded", attachLogoutHandler);

// Re-attach after navbar is injected (for fetched header)
window.attachLogoutHandler = attachLogoutHandler;
