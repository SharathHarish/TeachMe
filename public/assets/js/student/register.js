import { db, auth } from "../firebase/firebase.js";
import {
  collection,
  setDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


// ----------------------------
// DOM ELEMENTS
// ----------------------------
const regForm = document.getElementById("regForm");
const rid = document.getElementById("rid");
const rname = document.getElementById("rname");
const rclass = document.getElementById("rclass");
const remail = document.getElementById("remail");
const rpass = document.getElementById("rpass");


// ----------------------------
// REGISTER STUDENT
// ----------------------------
regForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const studentId = rid.value.trim();
  const email = remail.value.trim();
  const password = rpass.value.trim();

  if (!studentId) {
    Swal.fire({
      icon: "warning",
      title: "Missing Student ID",
      text: "Student ID is required.",
      confirmButtonColor: "#f97316"
    });
    return;
  }

  // Firestore refs
  const studentRef = doc(db, "student", studentId);
  const userRef = doc(db, "users", studentId);

  // ----------------------------
  // 1️⃣ CHECK DUPLICATE Student ID
  // ----------------------------
  const existing = await getDoc(studentRef);

  if (existing.exists()) {
    Swal.fire({
      icon: "error",
      title: "Duplicate Student ID",
      text: "A student with this ID already exists. Contact admin.",
      confirmButtonColor: "#ef4444"
    });
    return;
  }

  // ----------------------------
  // 2️⃣ CHECK DUPLICATE Email (semail)
  // ----------------------------
  const emailQuery = query(
    collection(db, "student"),
    where("semail", "==", email)
  );

  const emailSnap = await getDocs(emailQuery);

  if (!emailSnap.empty) {
    Swal.fire({
      icon: "error",
      title: "Email Already Registered",
      text: "This email ID already belongs to another student.",
      confirmButtonColor: "#ef4444"
    });
    return;
  }

  const studentData = {
    sid: studentId,
    sname: rname.value,
    sclass: rclass.value,
    semail: email
  };

  const userData = {
    id: studentId,
    email: email,
    access: "r",
    type: "student"
  };

  try {

    // ----------------------------
    // Create Firebase Auth User
    // ----------------------------
    await createUserWithEmailAndPassword(auth, email, password);

    // ----------------------------
    // Save in Firestore
    // ----------------------------
    await setDoc(studentRef, studentData);
    await setDoc(userRef, userData);

    Swal.fire({
      icon: "success",
      title: "Registration Successful!",
      text: "Your account has been created.",
      confirmButtonColor: "#4f46e5"
    }).then(() => {
      regForm.reset();
      window.location.href = "login.html";
    });

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text: err.message,
      confirmButtonColor: "#ef4444"
    });
  }
});
