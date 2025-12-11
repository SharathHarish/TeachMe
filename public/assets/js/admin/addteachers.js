// ==========================
// FIREBASE IMPORTS
// ==========================
import { db } from "../firebase/firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ==========================
// DOM ELEMENTS
// ==========================
const teachersList = document.getElementById("teachersList");
const tid = document.getElementById("tid");
const tname = document.getElementById("tname");
const temail = document.getElementById("temail");
const teacherdep = document.getElementById("teacherdep");
const teachersub = document.getElementById("teachersub");
const exp = document.getElementById("exp");
const form = document.querySelector("form");
const availableCheckboxes = document.querySelectorAll('input[name="available"]');

const filterInput = document.getElementById("filterTeacherId");
const filterDeptInput = document.getElementById("filterDepartment");
const filterSubInput = document.getElementById("filterSubject");
const resetBtn = document.getElementById("resetBtn");

const auth = getAuth();

// ==========================
// INITIAL LOAD
// ==========================
window.addEventListener("DOMContentLoaded", () => {
  loadTeachers();
});

// ==========================
// LOAD TEACHERS TABLE
// ==========================
async function loadTeachers() {
  teachersList.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

  const snapshot = await getDocs(collection(db, "teachers"));
  teachersList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const t = docSnap.data();
    const id = docSnap.id;

    const row = document.createElement("tr");
    row.classList.add("teacher-row");

    row.innerHTML = `
      <td class="tid">${t.teacherid}</td>
      <td>${t.name}</td>
      <td>${t.department}</td>
      <td>${t.subject}</td>
      <td>${t.email || "-"}</td>
      <td>${t.experience} years</td>
      <td>${t.availableDays.join(", ")}</td>
      <td>
        <button class="btn-primary" onclick="editTeacher('${id}')">Update</button>
        <button class="btn-danger" onclick="deleteTeacher('${id}')">Delete</button>
      </td>
    `;

    teachersList.appendChild(row);
  });

  filterTeachers();
}

// ==========================
// LIVE FILTER FUNCTION
// ==========================
function filterTeachers() {
  const searchTid = filterInput.value.trim().toLowerCase();
  const searchDept = filterDeptInput.value.toLowerCase();
  const searchSub = filterSubInput.value.toLowerCase();

  const rows = document.querySelectorAll(".teacher-row");

  rows.forEach(row => {
    const tidCell = row.querySelector(".tid")?.textContent.toLowerCase() || "";
    const deptCell = row.children[2]?.textContent.toLowerCase() || "";
    const subCell = row.children[3]?.textContent.toLowerCase() || "";

    const matchesTid = !searchTid || tidCell.includes(searchTid);
    const matchesDept = !searchDept || searchDept === "all" || deptCell === searchDept;
    const matchesSub = !searchSub || searchSub === "all" || subCell === searchSub;

    row.style.display = (matchesTid && matchesDept && matchesSub) ? "" : "none";
  });
}

// ==========================
// ATTACH LIVE FILTER EVENTS
// ==========================
filterInput.addEventListener("input", filterTeachers);
filterDeptInput.addEventListener("change", filterTeachers);
filterSubInput.addEventListener("change", filterTeachers);

resetBtn.addEventListener("click", () => {
  filterInput.value = "";
  filterDeptInput.value = "All";
  filterSubInput.value = "All";
  loadTeachers();
});

// ==========================
// DELETE TEACHER (SweetAlert2)
// ==========================
window.deleteTeacher = async function(id) {

  Swal.fire({
    title: "Are you sure?",
    text: "This teacher will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#e11d48"
  }).then(async (result) => {

    if (result.isConfirmed) {
      await deleteDoc(doc(db, "teachers", id));

      Swal.fire({
        title: "Deleted!",
        text: "Teacher removed successfully.",
        icon: "success",
        timer: 1800,
        showConfirmButton: false
      });

      loadTeachers();
    }

  });
};

// ==========================
// EDIT TEACHER POPUP
// ==========================
window.editTeacher = async function(id) {
  const snapshot = await getDocs(collection(db, "teachers"));
  const tDoc = snapshot.docs.find(d => d.id === id);
  const t = tDoc.data();

  const popup = document.createElement("div");
  popup.className = "popup-overlay";
  popup.style = `
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex; justify-content: center;
    align-items: center; z-index: 1000;
  `;

  popup.innerHTML = `
    <div class="popup" style="
      background: #fff; padding: 20px; border-radius: 10px;
      min-width: 300px; max-width: 500px;
    ">
      <h2>Edit Teacher</h2>
      <form id="editForm">
        <label>Teacher ID:</label>
        <input id="editId" value="${t.teacherid}" required>
        <label>Name:</label>
        <input id="editName" value="${t.name}" required>
        <label>Email:</label>
        <input id="editEmail" value="${t.email || ''}" required>
        <label>Department:</label>
        <input id="editDept" value="${t.department}" required>
        <label>Subject:</label>
        <input id="editSubject" value="${t.subject}" required>
        <label>Experience:</label>
        <input type="number" id="editExp" value="${t.experience}" required>
        <label>Available Days (comma separated):</label>
        <input id="editDays" value="${t.availableDays.join(', ')}" required>

        <div style="margin-top: 15px; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" id="updateBtn" class="btn-success">Update</button>
          <button type="button" id="cancelBtn" class="btn-danger">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("cancelBtn").onclick = () => popup.remove();

  document.getElementById("updateBtn").onclick = async () => {

    const updatedData = {
      teacherid: document.getElementById("editId").value.trim(),
      name: document.getElementById("editName").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      department: document.getElementById("editDept").value.trim(),
      subject: document.getElementById("editSubject").value.trim(),
      experience: parseInt(document.getElementById("editExp").value),
      availableDays: document.getElementById("editDays").value.split(",").map(d => d.trim())
    };

    try {
      await updateDoc(doc(db, "teachers", id), updatedData);

      Swal.fire({
        title: "Updated!",
        text: "Teacher details updated successfully.",
        icon: "success",
        confirmButtonColor: "#10b981"
      });

      popup.remove();
      loadTeachers();

    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message,
        icon: "error"
      });
    }
  };
};

// ==========================
// GENERATE RANDOM PASSWORD
// ==========================
function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

// ==========================
// ADD TEACHER (SweetAlert)
// ==========================
form.addEventListener("submit", async e => {
  e.preventDefault();

  const availableDays = Array.from(availableCheckboxes)
    .filter(c => c.checked)
    .map(c => c.value);

  if (!temail.value.endsWith("@stfrancis.edu.in")) {
    Swal.fire({
      title: "Invalid Email",
      text: "Email must end with @stfrancis.edu.in",
      icon: "error"
    });
    return;
  }

  const password = generatePassword();

  try {
    await createUserWithEmailAndPassword(auth, temail.value, password);

    await addDoc(collection(db, "teachers"), {
      teacherid: tid.value,
      name: tname.value,
      email: temail.value,
      password,
      department: teacherdep.value,
      subject: teachersub.value,
      experience: parseInt(exp.value),
      availableDays
    });

    await addDoc(collection(db, "users"), {
      access: "a",
      email: temail.value,
      id: tid.value,
      type: "teacher"
    });

    Swal.fire({
      title: "Teacher Added!",
      html: `
        <b>Email:</b> ${temail.value}<br>
        <b>Password:</b> ${password}
      `,
      icon: "success",
      confirmButtonColor: "#4f46e5"
    });

    form.reset();
    loadTeachers();

  } catch (err) {
    Swal.fire({
      title: "Error",
      text: err.message,
      icon: "error"
    });
  }
});
