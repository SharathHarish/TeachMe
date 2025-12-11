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
    row.classList.add("teacher-row"); // for filtering

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

  // Apply live filter immediately
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
// DELETE TEACHER
// ==========================
window.deleteTeacher = async function(id) {
  if (!confirm("Delete this teacher?")) return;
  await deleteDoc(doc(db, "teachers", id));
  alert("Teacher deleted.");
  loadTeachers();
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
      availableDays: document.getElementById("editDays").value
        .split(",")
        .map(d => d.trim())
    };

    await updateDoc(doc(db, "teachers", id), updatedData);
    alert("Updated successfully.");
    popup.remove();
    loadTeachers();
  };
};

// ==========================
// GENERATE RANDOM PASSWORD
// ==========================
function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

// ==========================
// ADD TEACHER
// ==========================
form.addEventListener("submit", async e => {
  e.preventDefault();

  const availableDays = Array.from(availableCheckboxes)
    .filter(c => c.checked)
    .map(c => c.value);

  if (!temail.value.endsWith("@stfrancis.edu.in")) {
    alert("Email must end with @stfrancis.edu.in");
    return;
  }

  const password = generatePassword();

  try {
    // Create Auth account
    await createUserWithEmailAndPassword(auth, temail.value, password);

    // Add to "teachers" collection
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

    // Add to "users" collection
    await addDoc(collection(db, "users"), {
      access: "a",
      email: temail.value,
      id: tid.value,
      type: "teacher"
    });

    alert(`Teacher Added Successfully!\n\nEmail: ${temail.value}\nPassword: ${password}`);
    form.reset();
    loadTeachers();
  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
});
