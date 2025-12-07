// login.js
import { loginUser } from './auth.js';
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    // 1. Authenticate using Firebase Auth
    const user = await loginUser(email, password);

    // 2. Get Firestore user record
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // If no record found → block login
    if (!userSnap.exists()) {
      alert("User record missing in database. Contact admin.");
      return;
    }

    const userData = userSnap.data();
    const type = userData.type;  
    const access = userData.access;   // <-- NEW

    // 3. ACCESS CHECK
    if (access !== "a") {
      alert("Your account is yet not activated. Contact admin.");
      return;
    }

    alert(`Login Successful! Welcome ${user.email} (${type})`);

    // 4. ROLE-BASED REDIRECT
    if (type === "admin") {
      window.location.href = "admin.html";
    } 
    else if (type === "teacher") {
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