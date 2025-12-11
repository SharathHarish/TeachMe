// login.js
import { loginUser } from './auth.js';
import { db } from './firebase.js';
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    // 1. Firebase Auth login
    const user = await loginUser(email, password);

    // ---------- ADMIN LOGIN ----------
    if (email === "adminteachme@gmail.com") {
      // For admin, store "admin" as session userId
      sessionStorage.setItem("userId", "admin");
      alert("Login Successful! Welcome ADMIN");
      window.location.href = "admin.html";
      return;
    }

    // ---------- TEACHER / STUDENT ----------
    // Query users collection where field 'email' matches input
    const q = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      alert("User record missing in database. Contact admin.");
      return;
    }

    const userDoc = snap.docs[0].data();

    // Take the 'id' field from this document
    const userFieldId = userDoc.id;
    const type = userDoc.type;
    const access = userDoc.access;

    // Save field id in sessionStorage
    sessionStorage.setItem("userId", userFieldId);

    // Access check
    if (access !== "a") {
      alert("Your account is not activated. Contact admin.");
      return;
    }

    alert(`Login Successful! Welcome ${email} (${type})`);

    // Redirect based on role
    if (type === "teacher") {
      window.location.href = "teacherDashboard.html";
    } else if (type === "student") {
      window.location.href = "studentDashboard.html";
    } else {
      alert("Unknown user type. Contact admin.");
    }

  } catch (error) {
    console.error(error);
    alert("Login failed: " + error.message);
  }
});
