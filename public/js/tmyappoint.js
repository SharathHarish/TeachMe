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

    let actionCell = "";

    if (data.status === "s") {
      actionCell = `
        <button class="btn-yellow scheduleBtn" data-id="${aid}">
          Schedule
        </button>

        <button class="btn-red rejectBtn" data-id="${aid}">
          Reject
        </button>
      `;
    } else if (data.status === "r") {
      actionCell = `
        <span style="color: red; font-weight: bold;">
          Appointment Rejected
        </span>
      `;
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${studentName}</td>
      <td>${studentClass}</td>
      <td>${studentMessage}</td>
      <td>${appDate}</td>
      <td>${data.startTime || "-"}</td>
      <td>${data.endTime || "-"}</td>
      <td>${data.status}</td>
      <td>${actionCell}</td>
    `;

    tbody.appendChild(tr);
  });

  attachButtonEvents();
}

// -------------------------------------------------------------
// POPUP — GLOBAL CREATE ONCE
// -------------------------------------------------------------
function createPopup() {
  if (document.getElementById("schedulePopup")) return;

  const popupHTML = `
    <div id="popupOverlay" style="
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.5); display:none; 
      justify-content:center; align-items:center;">
      
      <div id="schedulePopup" style="
        background:white; padding:20px; border-radius:10px;
        width:350px; box-shadow:0 0 20px rgba(0,0,0,0.3);">

        <h3 style="margin-bottom:15px;">Schedule Appointment</h3>

        <label>Date:</label>
        <input type="date" id="popupDate" style="width:100%; padding:6px; margin-bottom:10px;">

        <label>Start Time:</label>
        <input type="time" id="popupStart" style="width:100%; padding:6px; margin-bottom:10px;">

        <label>End Time:</label>
        <input type="time" id="popupEnd" style="width:100%; padding:6px; margin-bottom:15px;">

        <button id="popupSubmit" class="btn-yellow" style="width:48%;">Submit</button>
        <button id="popupCancel" class="btn-red" style="width:48%;">Cancel</button>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", popupHTML);
}

createPopup();

// -------------------------------------------------------------
// BUTTON EVENTS
// -------------------------------------------------------------
function attachButtonEvents() {
  // Schedule → show popup
  document.querySelectorAll(".scheduleBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const aid = btn.dataset.id;
      openSchedulePopup(aid);
    });
  });

  // Reject
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

// -------------------------------------------------------------
// POPUP OPEN
// -------------------------------------------------------------
function openSchedulePopup(aid) {
  document.getElementById("popupOverlay").style.display = "flex";

  document.getElementById("popupSubmit").onclick = async () => {
    const date = document.getElementById("popupDate").value;
    const start = document.getElementById("popupStart").value;
    const end = document.getElementById("popupEnd").value;

    if (!date || !start || !end) {
      alert("Please fill all fields.");
      return;
    }

    await updateDoc(doc(db, "appointment", aid), {
      appDate: date,
      startTime: start,
      endTime: end,
      status: "k"
    });

    closePopup();
    loadAppointments();
  };

  document.getElementById("popupCancel").onclick = closePopup;
}

// -------------------------------------------------------------
// POPUP CLOSE
// -------------------------------------------------------------
function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
}

loadAppointments();
