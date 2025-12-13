// searchTeachers.js
import { db } from "../firebase/firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit
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
  return snap.docs.map(doc => doc.data());
}
//Assign AID
async function getNextAid() {
  const q = query(
    collection(db, "appointment"),
    orderBy("aid", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);

  let nextAid = 1;

  if (!snap.empty) {
    const lastAid = snap.docs[0].data().aid || 0;
    nextAid = Number(lastAid) + 1;
  }

  return nextAid.toString(); // ✅ convert to string
}
// --------------------------
// Display Teachers
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

// --------------------------
// Handle Appointment Request
// --------------------------
async function requestAppointment(event) {
  const tid = event.target.getAttribute("tid");
  const sid = sessionStorage.getItem("userId");

  if (!sid) {
    alert("User not logged in!");
    return;
  }

  try {
    const nextAid = await getNextAid(); // NEW

    await addDoc(collection(db, "appointment"), {
      aid: nextAid,        // NEW FIELD
      tid: tid,
      sid: sid,
      status: "m",         // NEW FIELD (m = message/request sent)
      startTime: "",
      endTime: "",
      appDate: "",
      messages: ""
    });

    alert("Appointment request sent!");
    window.location.href = "sbookappoint.html";

  } catch (err) {
    console.error(err);
    alert("Failed to send appointment request.");
  }
}

// --------------------------
// Search Button
// --------------------------
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

// --------------------------
// Reset Button
// --------------------------
resetBtn.addEventListener("click", () => {
  nameInput.value = "";
  deptInput.value = "";
  subjectInput.value = "";
  teachersList.innerHTML = "";
});