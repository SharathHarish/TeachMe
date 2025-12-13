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
      sessionStorage.setItem("userId", "A000");

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Welcome ADMIN!',
        confirmButtonColor: '#4f46e5'
      }).then(() => {
        window.location.href = "./admin/adashboard.html";
      });

      return;
    }

    // ---------- TEACHER / STUDENT ----------
    const q = query(
      collection(db, "users"),
      where("email", "==", email)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      Swal.fire({
        icon: 'error',
        title: 'User Not Found',
        text: 'User record missing in database. Contact admin.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const userDoc = snap.docs[0].data();
    const userFieldId = userDoc.id;
    const type = userDoc.type;
    const access = userDoc.access;

    sessionStorage.setItem("userId", userFieldId);

    if (access !== "a") {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Your account is not activated. Contact admin.',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    Swal.fire({
      icon: 'success',
      title: 'Login Successful!',
      text: `Welcome ${email} (${type})`,
      confirmButtonColor: '#4f46e5'
    }).then(() => {
      if (type === "teacher") {
        window.location.href = "./teacher/tdashboard.html";
      } else if (type === "student") {
        window.location.href = "./student/sdashboard.html";
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Unknown User Type',
          text: 'Contact admin.',
          confirmButtonColor: '#ef4444'
        });
      }
    });

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: error.message,
      confirmButtonColor: '#ef4444'
    });
  }
});
