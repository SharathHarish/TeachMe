import { db } from "./firebase.js";
import { logout } from "./auth.js";
import { logEvent } from "./logger.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM
const teacherForm = document.getElementById("teacherForm");
const teacherList = document.getElementById("teacherList");
const searchBar = document.getElementById("searchBar");
const logoutBtn = document.getElementById("logoutBtn");

// Load Teachers
async function loadTeachers() {
  teacherList.innerHTML = "<li class='muted'>Loading...</li>";
  const snap = await getDocs(collection(db, "teachers"));

  let html = "";
  snap.forEach((d) => {
    const data = d.data();
    html += `
      <li class="teacher-card">
        <span>${data.name} — ${data.subject}</span>
        <button class="btn-primary edit" data-id="${d.id}">Edit</button>
        <button class="btn-danger" data-id="${d.id}">Delete</button>
      </li>
    `;
  });

  teacherList.innerHTML = html || "<li class='muted'>No teachers added yet.</li>";

  // Delete
  teacherList.querySelectorAll("button.btn-danger").forEach((btn) => {
    btn.onclick = async () => {
      if (confirm("Delete teacher?")) {
        await deleteDoc(doc(db, "teachers", btn.dataset.id));
        await logEvent("DELETE_TEACHER", {id: btn.dataset.id});
        loadTeachers();
      }
    };
  });

  // Edit
  teacherList.querySelectorAll("button.edit").forEach((btn) => {
    btn.onclick = async () => {
      const newName = prompt("New Teacher Name:");
      const newSubject = prompt("New Subject:");
      if(newName && newSubject) {
        await updateDoc(doc(db,"teachers",btn.dataset.id), {
          name:newName, subject:newSubject
        });
        await logEvent("UPDATE_TEACHER",{id:btn.dataset.id,newName,newSubject});
        loadTeachers();
      }
    };
  });
}

// Add Teacher
teacherForm.onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("tname").value.trim();
  const subject = document.getElementById("tsubject").value.trim();

  if (!name || !subject) return alert("Fill all fields");

  await addDoc(collection(db, "teachers"), { name, subject, createdAt: Date.now() });
  await logEvent("ADD_TEACHER",{name,subject});
  teacherForm.reset();
  loadTeachers();
};

// Logout
logoutBtn.onclick = async () => {
  await logout();
  location.href = "login.html";
};

// Search filter
searchBar.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll("#teacherList li").forEach(li=>{
    li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});

loadTeachers();
