// /assets/js/logout.js

// OPTIONAL Firebase logout
import { auth } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Function to execute logout
async function logoutUser() {
  try {
    // Remove session
    sessionStorage.clear();
    localStorage.clear();

    // Firebase sign out (if you're using auth)
    if (auth) {
      await signOut(auth);
    }

    // Redirect to login page
    window.location.href = "/login.html";

  } catch (err) {
    console.error("Logout error:", err);
  }
}

// Attach event listener ONLY if logout link exists
const logoutLink = document.getElementById("logoutLink");

if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault(); // prevent default a-tag navigation
    logoutUser();
  });
}
