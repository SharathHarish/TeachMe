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
    // 1. Firebase Auth Login
    const user = await loginUser(email, password);

    // If admin → SKIP Firestore check completely
    if (email === "adminteachme@gmail.com") {
      alert(`Login Successful! Welcome ADMIN`);
      window.location.href = "admin.html";
      return;
    }

    // 2. Query Firestore for teachers/students
    const q = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      alert("User record missing in database. Contact admin.");
      return;
    }

    const userData = snap.docs[0].data();
    const type = userData.type;
    const access = userData.access;

    // 3. Access Check (only for non-admin)
    if (access !== "a") {
      alert("Your account is not activated. Contact admin.");
      return;
    }

    alert(`Login Successful! Welcome ${user.email} (${type})`);

    // 4. Redirect Based on Role
    if (type === "teacher") {
      window.location.href = "teacherDashboard.html";
    } 
    else if (type === "student") {
      window.location.href = "studentDashboard.html";
    } 
    else {
      alert("Unknown user type. Contact admin.");
    }

  } catch (error) {
    console.error(error);
    alert("Login failed: " + error.message);
  }
});
