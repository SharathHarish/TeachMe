// searchTeachers.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const nameInput = document.getElementById("searchName");
const deptInput = document.getElementById("filterDepartment");
const subjectInput = document.getElementById("filterSubject");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const teachersList = document.getElementById("teachersList");

async function loadTeachers() {
  const snap = await getDocs(collection(db, "teachers"));
  return snap.docs.map(doc => doc.data());
}

function displayTeachers(list) {
  teachersList.innerHTML = "";

  if (list.length === 0) {
    teachersList.innerHTML = `<tr><td colspan="6">No teachers found</td></tr>`;
    return;
  }

  list.forEach(t => {
    const row = `
      <tr>
        <td>${t.name}</td>
        <td>${t.department}</td>
        <td>${t.subject}</td>
        <td>${t.email}</td>
        <td>${t.experience}</td>
        <td>${t.availableDays?.join(", ")}</td>
      </tr>
    `;
    teachersList.innerHTML += row;
  });
}

searchBtn.addEventListener("click", async () => {
  const all = await loadTeachers();

  const filtered = all.filter(t => {
    const matchName = t.name.toLowerCase().includes(nameInput.value.toLowerCase());
    const matchDept = deptInput.value === "" || t.department === deptInput.value;
    const matchSub = subjectInput.value === "" || t.subject === subjectInput.value;

    return matchName && matchDept && matchSub;
  });

  displayTeachers(filtered);
});

resetBtn.addEventListener("click", async () => {
  nameInput.value = "";
  deptInput.value = "";
  subjectInput.value = "";

  const all = await loadTeachers();
  displayTeachers(all);
});

// Load all on page load
(async () => {
  const all = await loadTeachers();
  displayTeachers(all);
})();
