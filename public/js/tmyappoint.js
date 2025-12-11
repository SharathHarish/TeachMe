import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Teacher ID
const teacherId = sessionStorage.getItem("userId");

// -------------------------------------------------------------
// Load STUDENT MAP (sid → {name, class})
// -------------------------------------------------------------
async function loadStudentsMap() {
  const snap = await getDocs(collection(db, "student"));

  const studentMap = {};

  snap.docs.forEach(s => {
    const data = s.data();

    if (data.sid) {
      studentMap[data.sid] = {
        sname: data.sname,
        sclass: data.sclass
      };
    }
  });

  return studentMap;
}

// -------------------------------------------------------------
// Load Appointments for Logged Teacher
// -------------------------------------------------------------
async function loadAppointments() {
  const tbody = document.getElementById("appointmentList");
  tbody.innerHTML = "";

  const studentMap = await loadStudentsMap();

  const q = query(
    collection(db, "appointment"),
    where("tid", "==", teacherId)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const aid = docSnap.id;

    const sInfo = studentMap[data.sid] || {};

    const studentName = sInfo.sname || "-";
    const studentClass = sInfo.sclass || "-";
    const studentMessage = data.message || "-";
    const appDate =
      data.appDate && data.appDate.trim() !== ""
        ? data.appDate
        : "Yet to be scheduled";

    // -------------------------------------------------------------
    // ACTION BUTTONS (Only for status = m)
    // -------------------------------------------------------------
    let actionCell = "";

    if (data.status === "s") {
      // ACTIVE — show Schedule + Reject
      actionCell = `
        <button class="btn-yellow scheduleBtn" data-id="${aid}">
          Schedule
        </button>

        <button class="btn-red rejectBtn" data-id="${aid}">
          Reject
        </button>
      `;
    } 
    
    else if (data.status === "r") {
      // REJECTED
      actionCell = `
        <span style="color: red; font-weight: bold;">
          Appointment Rejected
        </span>
      `;
    }

    // Any other status → show nothing (blank)

    // -------------------------------------------------------------
    // CREATE TABLE ROW
    // -------------------------------------------------------------
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${studentName}</td>
      <td>${studentClass}</td>
      <td>${studentMessage}</td>
      <td>${appDate}</td>
      <td>${data.startTime || "-"}</td>
      <td>${data.status}</td>
      <td>${actionCell}</td>
    `;

    tbody.appendChild(tr);
  });

  attachButtonEvents();
}

// -------------------------------------------------------------
// BUTTON EVENTS
// -------------------------------------------------------------
function attachButtonEvents() {
  // Schedule Button
  document.querySelectorAll(".scheduleBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const aid = btn.dataset.id;
      window.location.href = `tmyappoint.html?aid=${aid}`;
    });
  });

  // Reject Button
  document.querySelectorAll(".rejectBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const aid = btn.dataset.id;

      await updateDoc(doc(db, "appointment", aid), {
        status: "r"
      });

      loadAppointments();
    });
  });
}

loadAppointments();
