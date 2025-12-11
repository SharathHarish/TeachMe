import { db } from "../firebase/firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const studentsList = document.getElementById("studentsList"); // All students list
const approvedList = document.getElementById("approvedList"); // Approved students list
const filterSidInput = document.getElementById("filterSid"); // SID filter input

// -------------------------
// ON PAGE LOAD
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadStudents();
  loadApprovedStudents();
});

// -------------------------
// LOAD ALL STUDENTS
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

      // Fetch user access state from users collection
      const userQuery = query(collection(db, "users"), where("id", "==", s.sid));
      const userSnap = await getDocs(userQuery);

      let access = null;
      if (!userSnap.empty) {
        access = userSnap.docs[0].data().access; // 'a' or 'r'
      }

      studentsList.innerHTML += createRow(s, access);
    }

    // Apply filter after loading
    filterStudents();

  } catch (err) {
    console.error("Error loading students:", err);
    studentsList.innerHTML = `<tr><td colspan="6">Failed to load students.</td></tr>`;
  }
}

// -------------------------
// LOAD APPROVED STUDENTS
// -------------------------
async function loadApprovedStudents() {
  approvedList.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  try {
    const usersSnapshot = await getDocs(
      query(collection(db, "users"), where("access", "==", "a"))
    );

    approvedList.innerHTML = "";

    if (usersSnapshot.empty) {
      approvedList.innerHTML = `<tr><td colspan="6">No approved students.</td></tr>`;
      return;
    }

    for (const userDoc of usersSnapshot.docs) {
      const sid = userDoc.data().id;

      const studentQuery = query(
        collection(db, "student"),
        where("sid", "==", sid)
      );

      const studentSnap = await getDocs(studentQuery);

      if (!studentSnap.empty) {
        const s = studentSnap.docs[0].data();
        approvedList.innerHTML += createApprovedRow(s);
      }
    }

  } catch (err) {
    console.error("Error loading approved:", err);
    approvedList.innerHTML = `<tr><td colspan="6">Failed to load approved.</td></tr>`;
  }
}

// -------------------------
// CREATE ROW FOR MAIN TABLE
// -------------------------
function createRow(s, access) {
  const btnText = access === "a" ? "Revoke Access" : "Approve Access";
  const btnClass = access === "a" ? "btn-danger" : "btn-success";

  return `
    <tr class="student-row">
      <td class="sid">${s.sid}</td>
      <td>${s.sname}</td>
      <td>${s.semail}</td>
      <td>${s.sclass}</td>
      <td>
        <button id="toggle-${s.sid}" class="${btnClass}" onclick="toggleAccess('${s.sid}')">
          ${btnText}
        </button>
      </td>
    </tr>
  `;
}

// -------------------------
// CREATE APPROVED STUDENT ROW
// -------------------------
function createApprovedRow(s) {
  return `
    <tr>
      <td>${s.sid}</td>
      <td>${s.sname}</td>
      <td>${s.semail}</td>
      <td>${s.sclass}</td>
    </tr>
  `;
}

// -------------------------
// FILTER BY STUDENT ID (SID)
// -------------------------
function filterStudents() {
  const searchValue = filterSidInput.value.trim().toLowerCase();
  const rows = document.querySelectorAll("#studentsList .student-row");

  rows.forEach(row => {
    const sidCell = row.querySelector(".sid")?.textContent.toLowerCase() || "";
    row.style.display = sidCell.includes(searchValue) ? "" : "none";
  });
}

// LIVE FILTER
filterSidInput.addEventListener("input", filterStudents);

// -------------------------
// TOGGLE ACCESS
// -------------------------
window.toggleAccess = async function (sid) {
  try {
    const q = query(collection(db, "users"), where("id", "==", sid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert(`No user found for Student ID ${sid}`);
      return;
    }

    const docRef = snapshot.docs[0].ref;
    const currentAccess = snapshot.docs[0].data().access;
    const newAccess = currentAccess === "a" ? "r" : "a";

    await updateDoc(docRef, { access: newAccess });

    // Update button UI
    const btn = document.getElementById(`toggle-${sid}`);
    if (newAccess === "a") {
      btn.textContent = "Revoke Access";
      btn.className = "btn-danger";
    } else {
      btn.textContent = "Approve Access";
      btn.className = "btn-success";
    }

    console.log(`Student ${sid} access updated to: ${newAccess}`);

    // Refresh approved students table
    loadApprovedStudents();

  } catch (err) {
    console.error("Error toggling student access:", err);
    alert("Failed to update student access.");
  }
};
