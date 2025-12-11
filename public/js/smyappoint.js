import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Student ID
const studentId = sessionStorage.getItem("userId");

// -------------------------------------------------------------
// Load Teachers into a MAP (tid → {name, dep, sub})
// -------------------------------------------------------------
async function loadTeachersMap() {
  const snap = await getDocs(collection(db, "teachers"));

  const teacherMap = {};

  snap.docs.forEach(t => {
    const data = t.data();

    teacherMap[data.tid] = {
      name: data.name,
      department: data.department,
      subject: data.subject
    };
  });

  return teacherMap;
}

// -------------------------------------------------------------
// Load Appointments for Logged Student
// -------------------------------------------------------------
async function loadAppointments() {
  const tbody = document.getElementById("appointmentList");
  tbody.innerHTML = "";

  const teacherMap = await loadTeachersMap();

  const q = query(
    collection(db, "appointment"),
    where("sid", "==", studentId)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const tInfo = teacherMap[data.tid] || {};

    const teacherName = tInfo.name || data.tid;
    const teacherDep = tInfo.department || "-";
    const teacherSub = tInfo.subject || "-";

    // Handle empty appDate
    const appDate = data.appDate && data.appDate.trim() !== ""
      ? data.appDate
      : "Yet to be scheduled";

    // Action button logic
    let actionCell = "";
    if (data.status === "m") {
      actionCell = `
        <button class="btn-success completeBtn"
                data-docid="${data.aid}">
          Complete Appointment
        </button>
      `;
    } else {
      actionCell = `<span style="color: blue; font-weight: bold;">
                      Appointment Request Completed
                    </span>`;
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${teacherName}</td>
      <td>${teacherDep}</td>
      <td>${teacherSub}</td>
      <td>${appDate}</td>
      <td>${data.startTime || "-"}</td>
      <td>${data.status}</td>
      <td>${actionCell}</td>
    `;

    tbody.appendChild(tr);
  });

  // Attach event listeners only to active buttons
  document.querySelectorAll(".completeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const aid = btn.dataset.docid;
      window.location.href = `smyappoint.html?aid=${aid}`;
    });
  });
}

loadAppointments();
