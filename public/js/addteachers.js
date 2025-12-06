import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// -------------------------
// DOM ELEMENTS
// -------------------------
const teachersList = document.getElementById("teachersList"); // tbody
const tid = document.getElementById("tid");
const tname = document.getElementById("tname");
const temail = document.getElementById("temail");
const teacherdep = document.getElementById("teacherdep");
const teachersub = document.getElementById("teachersub");
const exp = document.getElementById("exp");
const form = document.querySelector("form");

const availableCheckboxes = document.querySelectorAll('input[name="available"]');

// -------------------------
// PRE-FILL FORM
// -------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadTeachers();
});

// -------------------------
// LOAD TEACHERS (TABLE)
// -------------------------
async function loadTeachers() {
  teachersList.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

  const snapshot = await getDocs(collection(db, "teachers"));

  teachersList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const t = docSnap.data();
    const id = docSnap.id;

    teachersList.innerHTML += createTableRow(id, t);
  });
}

// -------------------------
// CREATE TABLE ROW
// -------------------------
function createTableRow(id, t) {
  return `
    <tr>
      <td class="tid">${t.teacherid}</td>
      <td>${t.name}</td>
      <td>${t.department}</td>
      <td>${t.subject}</td>
      <td>${t.email ? t.email : "-"}</td>
      <td>${t.experience} yrs</td>
      <td>${t.availableDays.join(", ")}</td>
      <td>
        <button class="btn-primary" onclick="editTeacher('${id}')">Update</button>
        <button class="btn-danger" onclick="deleteTeacher('${id}')">Delete</button>
      </td>
    </tr>
  `;
}

// -------------------------
// DELETE TEACHER
// -------------------------
window.deleteTeacher = async function (id) {
  if (!confirm("Delete this teacher?")) return;

  await deleteDoc(doc(db, "teachers", id));

  alert("Teacher deleted.");
  loadTeachers();
};

// -------------------------
// EDIT TEACHER POPUP
// -------------------------
window.editTeacher = async function (id) {
  const snapshot = await getDocs(collection(db, "teachers"));
  const tDoc = snapshot.docs.find(d => d.id === id);
  const t = tDoc.data();

  const popup = document.createElement("div");
  popup.className = "popup-overlay";

  popup.innerHTML = `
    <div class="popup">
      <h2>Edit Teacher</h2>

      <label>Teacher ID:</label>
      <input id="editId" value="${t.teacherid}">

      <label>Name:</label>
      <input id="editName" value="${t.name}">

      <label>Email:</label>
      <input id="editEmail" value="${t.email || ""}">

      <label>Department:</label>
      <input id="editDept" value="${t.department}">

      <label>Subject:</label>
      <input id="editSubject" value="${t.subject}">

      <label>Experience:</label>
      <input type="number" id="editExp" value="${t.experience}">

      <label>Available Days (comma separated):</label>
      <input id="editDays" value="${t.availableDays.join(", ")}">

      <div style="display:flex; gap:10px; margin-top:15px;">
        <button class="btn-success" id="saveBtn">Save</button>
        <button class="btn-danger" id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  document.getElementById("cancelBtn").onclick = () => popup.remove();

  document.getElementById("saveBtn").onclick = async () => {
    const updatedData = {
      teacherid: document.getElementById("editId").value,
      name: document.getElementById("editName").value,
      email: document.getElementById("editEmail").value,
      department: document.getElementById("editDept").value,
      subject: document.getElementById("editSubject").value,
      experience: parseInt(document.getElementById("editExp").value),
      availableDays: document
        .getElementById("editDays")
        .value.split(",")
        .map(d => d.trim())
    };

    await updateDoc(doc(db, "teachers", id), updatedData);

    alert("Updated.");
    popup.remove();
    loadTeachers();
  };
};

// -------------------------
// FILTER BY TEACHER ID
// -------------------------
const filterInput = document.getElementById("filterTid");

if (filterInput) {
  filterInput.addEventListener("input", () => {
    const value = filterInput.value.toLowerCase();
    const rows = teachersList.querySelectorAll("tr");

    rows.forEach(row => {
      const tidCell = row.querySelector(".tid").textContent.toLowerCase();
      row.style.display = tidCell.includes(value) ? "" : "none";
    });
  });
}

// -------------------------
// ADD TEACHER
// -------------------------
form.addEventListener("submit", async e => {
  e.preventDefault();

  const availableDays = Array.from(availableCheckboxes)
    .filter(c => c.checked)
    .map(c => c.value);

  // Email validation (must end with @stfrancis.edu.in)
  if (!temail.value.endsWith("@stfrancis.edu.in")) {
    alert("Email must end with @stfrancis.edu.in");
    return;
  }

  await addDoc(collection(db, "teachers"), {
    teacherid: tid.value,
    name: tname.value,
    email: temail.value,
    department: teacherdep.value,
    subject: teachersub.value,
    experience: parseInt(exp.value),
    availableDays
  });

  alert("Teacher added!");
  form.reset();
  loadTeachers();
});
