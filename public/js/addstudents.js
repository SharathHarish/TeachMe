import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// -------------------------
// DOM ELEMENTS
// -------------------------
const studentsList = document.getElementById("studentsList"); // tbody

// -------------------------
// LOAD STUDENTS
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadStudents();
});

// -------------------------
// FETCH + DISPLAY STUDENTS
// -------------------------
async function loadStudents() {
  studentsList.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "student"));

    studentsList.innerHTML = ""; // clear

    if (snapshot.empty) {
      studentsList.innerHTML = `<tr><td colspan="6">No students found.</td></tr>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const s = docSnap.data();
      const id = docSnap.id; // Firestore document ID
      studentsList.innerHTML += createRow(s);
    });

  } catch (err) {
    console.error("Error loading students:", err);
    studentsList.innerHTML = `<tr><td colspan="6">Failed to load students.</td></tr>`;
  }
}

// -------------------------
// CREATE TABLE ROW
// -------------------------
function createRow(s) {
  return `
    <tr>
      <td>${s.sid}</td>
      <td>${s.sname}</td>
      <td>${s.semail}</td>
      <td>${s.sclass}</td>
      <td>${s.sphone}</td>
      <td>
        <button class="btn-success" onclick="approveStudent('${s.sid}')">Grant Access</button>
        <button class="btn-danger" onclick="rejectStudent('${s.sid}')">Reject</button>
      </td>
    </tr>
  `;
}

// -------------------------
// APPROVE STUDENT ACCESS
// -------------------------
window.approveStudent = async function(sid) {
  try {
    const q = query(collection(db, "users"), where("id", "==", sid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert(`No user found for Student ID ${sid}`);
      return;
    }

    snapshot.forEach(async docSnap => {
      await updateDoc(docSnap.ref, { access: "a" }); // approved
    });

    alert(`Student ${sid} approved.`);
  } catch (err) {
    console.error("Error approving student:", err);
    alert("Failed to approve student.");
  }
};

// -------------------------
// REJECT STUDENT ACCESS
// -------------------------
window.rejectStudent = async function(sid) {
  try {
    const q = query(collection(db, "users"), where("id", "==", sid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert(`No user found for Student ID ${sid}`);
      return;
    }

    snapshot.forEach(async docSnap => {
      await updateDoc(docSnap.ref, { access: "r" }); // rejected
    });

    alert(`Student ${sid} rejected.`);
  } catch (err) {
    console.error("Error rejecting student:", err);
    alert("Failed to reject student.");
  }
};
