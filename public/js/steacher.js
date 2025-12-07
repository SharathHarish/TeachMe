// searchTeachers.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const nameInput = document.getElementById("searchName");
const deptInput = document.getElementById("filterDepartment");
const subjectInput = document.getElementById("filterSubject");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const teachersList = document.getElementById("teachersList");

// --------------------------
// Load All Teachers
// --------------------------
async function loadTeachers() {
  const snap = await getDocs(collection(db, "teachers"));
  return snap.docs.map(doc => doc.data()); // contains tid inside
}

// --------------------------
// Display Teachers in Table
// --------------------------
function displayTeachers(list) {
  teachersList.innerHTML = "";

  if (list.length === 0) {
    teachersList.innerHTML = `<tr><td colspan="7">No teachers found</td></tr>`;
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
        <td>
          <button class="requestBtn" tid="${t.tid}">Request Appointment</button>
        </td>
      </tr>
    `;
    teachersList.innerHTML += row;
  });

  // Activate buttons
  document.querySelectorAll(".requestBtn").forEach(btn => {
    btn.addEventListener("click", requestAppointment);
  });
}

// --------------------------------
// Handle Appointment Request
// --------------------------------
async function requestAppointment(event) {
  const tid = event.target.getAttribute("tid"); // 
  const sid = sessionStorage.getItem("userId");

  if (!sid) {
    alert("User not logged in! No SID found in sessionStorage.");
    return;
  }

  try {
    await addDoc(collection(db, "appointment"), {
      tid: tid,
      sid: sid,
      startTime: "",
      endTime: "",
      appDate: "",
      messages: ""
    });

alert("Appointment request sent!");

    // Redirect after success
    window.location.href = "smyappoint.html";

  } catch (err) {
    console.error(err);
    alert("Failed to send appointment request.");
  }
}

// --------------------------------
// Search Button Click
// --------------------------------
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

// --------------------------------
// Reset Button Click
// --------------------------------
resetBtn.addEventListener("click", () => {
  nameInput.value = "";
  deptInput.value = "";
  subjectInput.value = "";
  teachersList.innerHTML = "";
});
