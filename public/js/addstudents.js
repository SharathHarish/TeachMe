import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const studentsList = document.getElementById("studentsList");

window.addEventListener("DOMContentLoaded", () => {
  loadStudents();
});

// -------------------------
// LOAD STUDENTS
// -------------------------
async function loadStudents() {
  studentsList.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "student"));
    studentsList.innerHTML = "";

    if (snapshot.empty) {
      studentsList.innerHTML = `<tr><td colspan="6">No students found.</td></tr>`;
      return;
    }

    for (const docSnap of snapshot.docs) {
      const s = docSnap.data();

      // Get user access status from users collection
      const userQuery = query(collection(db, "users"), where("id", "==", s.sid));
      const userSnap = await getDocs(userQuery);

      let access = null;
      if (!userSnap.empty) {
        access = userSnap.docs[0].data().access; // 'a' or 'r'
      }

      studentsList.innerHTML += createRow(s, access);
    }

  } catch (err) {
    console.error("Error loading students:", err);
    studentsList.innerHTML = `<tr><td colspan="6">Failed to load students.</td></tr>`;
  }
}

// -------------------------
// CREATE TABLE ROW
// -------------------------
function createRow(s, access) {
  const btnText = access === "a" ? "Reject" : "Grant Access";
  const btnClass = access === "a" ? "btn-danger" : "btn-success";

  return `
    <tr>
      <td>${s.sid}</td>
      <td>${s.sname}</td>
      <td>${s.semail}</td>
      <td>${s.sclass}</td>
      <td>${s.sphone}</td>
      <td>
        <button id="toggle-${s.sid}" class="${btnClass}" onclick="toggleAccess('${s.sid}')">${btnText}</button>
      </td>
    </tr>
  `;
}

// -------------------------
// TOGGLE ACCESS
// -------------------------
window.toggleAccess = async function(sid) {
  try {
    const q = query(collection(db, "users"), where("id", "==", sid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert(`No user found for Student ID ${sid}`);
      return;
    }

    // Get the first matched document
    const docRef = snapshot.docs[0].ref;
    const currentAccess = snapshot.docs[0].data().access;
    const newAccess = currentAccess === "a" ? "r" : "a";

    // Update Firestore
    await updateDoc(docRef, { access: newAccess });

    // Update button instantly
    const btn = document.getElementById(`toggle-${sid}`);
    if (newAccess === "a") {
      btn.textContent = "Revoke Access";
      btn.className = "btn-danger";
    } else {
      btn.textContent = "Approve Access";
      btn.className = "btn-success";
    }

    console.log(`Student ${sid} access updated to: ${newAccess}`);

  } catch (err) {
    console.error("Error toggling student access:", err);
    alert("Failed to update student access.");
  }
};
