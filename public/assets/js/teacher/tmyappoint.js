import { db } from "../firebase/firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  getDoc
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
      studentMap[data.sid] = { sname: data.sname, sclass: data.sclass };
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
  const q = query(collection(db, "appointment"), where("tid", "==", teacherId));
  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const aid = docSnap.id;
    const sInfo = studentMap[data.sid] || {};
    const studentName = sInfo.sname || "-";
    const studentClass = sInfo.sclass || "-";
    const studentMessage = data.message || "-";
    const appDate = data.appDate && data.appDate.trim() !== "" ? data.appDate : "Yet to be scheduled";

    let actionCell = "";
    if (data.status === "s") {
      actionCell = `
        <button class="btn-yellow scheduleBtn" data-id="${aid}">Schedule</button>
        <button class="btn-red rejectBtn" data-id="${aid}">Reject</button>
      `;
    } else if (data.status === "r") {
      actionCell = `<span style="color: red; font-weight: bold;">Appointment Rejected</span>`;
    } else if (data.status === "k") {
      actionCell = `<span style="color: green; font-weight: bold;">Appointment Scheduled</span>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${studentName}</td>
      <td>${studentClass}</td>
      <td>${studentMessage}</td>
      <td>${appDate}</td>
      <td>${data.startTime || "-"}</td>
      <td>${data.endTime || "-"}</td>
      <td>${actionCell}</td>
    `;
    tbody.appendChild(tr);
  });

  attachButtonEvents();
}

// -------------------------------------------------------------
// POPUP — CREATE ONCE
// -------------------------------------------------------------
function createPopup() {
  if (document.getElementById("schedulePopup")) return;

  const popupHTML = `
    <div id="popupOverlay" style="
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 9999;">
      
      <div id="schedulePopup" style="
        background: white;
        padding: 20px;
        border-radius: 10px;
        width: 380px;
        max-width: 95%;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);">
        
        <h3 style="margin-bottom: 15px;">Schedule Appointment</h3>
        
        <label for="popupDate">Date:</label>
        <input type="date" id="popupDate" style="width: 100%; padding: 8px; margin-bottom: 10px;">
        
        <label for="popupStart">Start Time:</label>
        <input type="time" id="popupStart" style="width: 100%; padding: 8px; margin-bottom: 10px;">
        
        <label for="popupEnd">End Time:</label>
        <input type="time" id="popupEnd" style="width: 100%; padding: 8px; margin-bottom: 10px;">
        
        <label for="popupMessage">Message to Teacher:</label>
        <textarea id="popupMessage" rows="3" style="width: 100%; padding: 8px; margin-bottom: 12px;" placeholder="Optional message to teacher"></textarea>
        
        <div style="display: flex; gap: 8px;">
          <button id="popupSubmit" class="btn-yellow" style="flex:1; padding: 8px;">Submit</button>
          <button id="popupCancel" class="btn-red" style="flex:1; padding: 8px;">Cancel</button>
        </div>

        <div id="popupError" style="color:#b00020; margin-top: 10px; display:none;"></div>
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
  document.querySelectorAll(".scheduleBtn").forEach(btn => {
    btn.addEventListener("click", () => openSchedulePopup(btn.dataset.id));
  });

  document.querySelectorAll(".rejectBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const aid = btn.dataset.id;
      await updateDoc(doc(db, "appointment", aid), { status: "r" });
      loadAppointments();
    });
  });
}

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
function timeToMinutes(t) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function rangesOverlap(s1, e1, s2, e2) {
  return Math.max(s1, s2) < Math.min(e1, e2);
}

function weekdayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[d.getDay()];
}

async function getTeacherAvailability(tid) {
  const tDoc = await getDoc(doc(db, "teachers", tid));
  if (!tDoc.exists()) return [];
  const data = tDoc.data();
  return Array.isArray(data.availableDays) ? data.availableDays : [];
}

async function hasClash({ date, startMin, endMin, teacherIdCheck, studentIdCheck, excludeAid = null }) {
  const q = query(collection(db, "appointment"), where("appDate", "==", date));
  const snap = await getDocs(q);

  for (const docSnap of snap.docs) {
    const a = docSnap.data();
    const aid = docSnap.id;

    if (aid === excludeAid || a.status === "r" || !a.startTime || !a.endTime) continue;

    const aStart = timeToMinutes(a.startTime);
    const aEnd = timeToMinutes(a.endTime);

    if ((a.tid === teacherIdCheck || a.sid === studentIdCheck) && rangesOverlap(startMin, endMin, aStart, aEnd)) {
      return {
        clash: true,
        reason: a.tid === teacherIdCheck ? "teacher" : "student",
        conflictWith: aid,
        conflictAppointment: a
      };
    }
  }

  return { clash: false };
}

// -------------------------------------------------------------
// POPUP OPEN
// -------------------------------------------------------------
async function openSchedulePopup(aid) {
  const overlay = document.getElementById("popupOverlay");
  overlay.style.display = "flex";

  const popupError = document.getElementById("popupError");
  popupError.style.display = "none";
  popupError.textContent = "";

  const appointmentRef = doc(db, "appointment", aid);
  const appointmentSnap = await getDoc(appointmentRef);
  const appointmentData = appointmentSnap.exists() ? appointmentSnap.data() : {};

  const popupDate = document.getElementById("popupDate");
  const popupStart = document.getElementById("popupStart");
  const popupEnd = document.getElementById("popupEnd");
  const popupMessage = document.getElementById("popupMessage");

  popupDate.value = appointmentData.appDate || "";
  popupStart.value = appointmentData.startTime || "";
  popupEnd.value = appointmentData.endTime || "";
  popupMessage.value = appointmentData.tmessage || "";

  // BLOCK PAST DATES
  const today = new Date().toISOString().split("T")[0];
  popupDate.setAttribute("min", today);

  // AUTO-SET END TIME (+30 mins)
  popupStart.onchange = () => {
    const start = popupStart.value;
    if (!start) return;
    const startMin = timeToMinutes(start);
    const autoEnd = startMin + 30;
    let hh = Math.floor(autoEnd / 60);
    let mm = autoEnd % 60;
    if (hh > 23) hh = 23;
    if (mm > 59) mm = 59;
    popupEnd.value = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // POPUP SUBMIT
  document.getElementById("popupSubmit").onclick = async () => {
    const date = popupDate.value;
    const start = popupStart.value;
    const end = popupEnd.value;
    const message = popupMessage.value || "";

    popupError.style.display = "none";
    popupError.textContent = "";

    if (!start || !end || !date) {
      popupError.textContent = "Date, Start and End times are required.";
      popupError.style.display = "block";
      return;
    }

    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);

    if (endMin <= startMin) {
      popupError.textContent = "End time must be after Start time.";
      popupError.style.display = "block";
      return;
    }

    const duration = endMin - startMin;
    if (duration < 30) {
      popupError.textContent = "Meeting must be at least 30 minutes long.";
      popupError.style.display = "block";
      return;
    }
    if (duration > 60) {
      popupError.textContent = "Meeting cannot exceed 60 minutes.";
      popupError.style.display = "block";
      return;
    }

    const clash = await hasClash({
      date,
      startMin,
      endMin,
      teacherIdCheck: teacherId,
      studentIdCheck: appointmentData.sid,
      excludeAid: aid
    });

    if (clash.clash) {
      popupError.textContent = clash.reason === "teacher"
        ? "This time conflicts with another appointment for the teacher."
        : "This time conflicts with another appointment for the student.";
      popupError.style.display = "block";
      return;
    }

    try {
      await updateDoc(doc(db, "appointment", aid), {
        appDate: date,
        startTime: start,
        endTime: end,
        status: "k",
        tmessage: message
      });
      closePopup();
      loadAppointments();
    } catch (err) {
      console.error("Error updating appointment:", err);
      popupError.textContent = "Failed to update appointment.";
      popupError.style.display = "block";
    }
  };

  document.getElementById("popupCancel").onclick = closePopup;
}

// -------------------------------------------------------------
// POPUP CLOSE
// -------------------------------------------------------------
function closePopup() {
  const overlay = document.getElementById("popupOverlay");
  if (overlay) overlay.style.display = "none";

  const popupError = document.getElementById("popupError");
  if (popupError) {
    popupError.style.display = "none";
    popupError.textContent = "";
  }
}

// -------------------------------------------------------------
loadAppointments();
