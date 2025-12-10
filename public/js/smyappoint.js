import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Student ID from localStorage

const studentId = sessionStorage.getItem("userId");


// -------------------------------------------------------------
// Load Teachers into a MAP for fast lookup (tid → teacherName)
// -------------------------------------------------------------
async function loadTeachersMap() {
  const snap = await getDocs(collection(db, "teachers"));

  const teacherMap = {};
  snap.docs.forEach(t => {
    const data = t.data();
    teacherMap[data.tid] = data.name;   // store name by tid
  });

  return teacherMap;
}

// -------------------------------------------------------------
// Load Appointments for Logged Student
// -------------------------------------------------------------
async function loadAppointments() {
  const tbody = document.getElementById("appointmentList");
  tbody.innerHTML = "";

  const teacherMap = await loadTeachersMap(); // get teacher names

  const q = query(
    collection(db, "appointment"),
    where("sid", "==", studentId)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const data = docSnap.data();

    // Convert teacher tid → teacher name
    const teacherName = teacherMap[data.tid] || data.tid;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${teacherName}</td>
      <td>${data.appDate || "-"}</td>
      <td>${data.startTime || "-"}</td>
      <td>${data.status}</td>

      <td>
        <button class="btn-success completeBtn"
                data-docid="${data.aid}">
          Complete Appointment
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Click handlers for Complete buttons
  document.querySelectorAll(".completeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const docId = btn.dataset.docid;
      window.location.href = `smessage.html?aid=${docId}`;
    });
  });
}

loadAppointments();
