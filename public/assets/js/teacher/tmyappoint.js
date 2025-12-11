import { db } from "../js/firebase.js";
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
// POPUP — GLOBAL CREATE ONCE (now includes message field)
// -------------------------------------------------------------
function createPopup() {
  if (document.getElementById("schedulePopup")) return;

  const popupHTML = `
    <div id="popupOverlay" style="
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.5); display:none; 
      justify-content:center; align-items:center; z-index:9999;">
      
      <div id="schedulePopup" style="
        background:white; padding:20px; border-radius:10px;
        width:380px; max-width:95%; box-shadow:0 0 20px rgba(0,0,0,0.3);">

        <h3 style="margin-bottom:15px;">Schedule Appointment</h3>

        <label for="popupDate">Date:</label>
        <input type="date" id="popupDate" style="width:100%; padding:8px; margin-bottom:10px;">

        <label for="popupStart">Start Time:</label>
        <input type="time" id="popupStart" style="width:100%; padding:8px; margin-bottom:10px;">

        <label for="popupEnd">End Time:</label>
        <input type="time" id="popupEnd" style="width:100%; padding:8px; margin-bottom:10px;">

        <label for="popupMessage">Message to Teacher:</label>
        <textarea id="popupMessage" rows="3" style="width:100%; padding:8px; margin-bottom:12px;" placeholder="Optional message to teacher"></textarea>

        <div style="display:flex; gap:8px;">
          <button id="popupSubmit" class="btn-yellow" style="flex:1; padding:8px;">Submit</button>
          <button id="popupCancel" class="btn-red" style="flex:1; padding:8px;">Cancel</button>
        </div>

        <div id="popupError" style="color:#b00020; margin-top:10px; display:none;"></div>
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
// Helper: parse "HH:MM" -> minutes since midnight
// -------------------------------------------------------------
function timeToMinutes(t) {
  if (!t) return null;
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

// -------------------------------------------------------------
// Helper: check overlap between two time ranges [s1,e1) & [s2,e2)
// -------------------------------------------------------------
function rangesOverlap(s1, e1, s2, e2) {
  return Math.max(s1, s2) < Math.min(e1, e2);
}

// -------------------------------------------------------------
// Helper: weekday name from date string "YYYY-MM-DD"
// returns 'Sun','Mon',... 'Sat'
// -------------------------------------------------------------
function weekdayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[d.getDay()];
}

// -------------------------------------------------------------
// Get teacher availability (availableDays field expected array of day names)
// -------------------------------------------------------------
async function getTeacherAvailability(tid) {
  try {
    const tDoc = await getDoc(doc(db, "teachers", tid));
    if (!tDoc.exists()) return null;
    const data = tDoc.data();
    // Expecting something like ["Mon","Tue","Fri"]
    return Array.isArray(data.availableDays) ? data.availableDays : [];
  } catch (err) {
    console.error("Error fetching teacher availability", err);
    return null;
  }
}

// -------------------------------------------------------------
// Check clashes for given date/time with teacher or student
// exclude a specific appointment id (the one being scheduled) so we don't check against itself
// -------------------------------------------------------------
async function hasClash({ date, startMin, endMin, teacherIdCheck, studentIdCheck, excludeAid = null }) {
  // Fetch appointments on the same date that are not rejected (status !== 'r')
  const q = query(
    collection(db, "appointment"),
    where("appDate", "==", date)
  );

  const snap = await getDocs(q);

  for (const docSnap of snap.docs) {
    const a = docSnap.data();
    const aid = docSnap.id;

    if (aid === excludeAid) continue; // skip same appointment

    // treat rejected appointments as non-conflicting
    if (a.status === "r") continue;

    // if appointment has no times, skip
    if (!a.startTime || !a.endTime) continue;

    const aStart = timeToMinutes(a.startTime);
    const aEnd = timeToMinutes(a.endTime);

    // if teacher or student matches, check overlap
    if ((a.tid === teacherIdCheck) || (a.sid === studentIdCheck)) {
      if (rangesOverlap(startMin, endMin, aStart, aEnd)) {
        return {
          clash: true,
          reason: a.tid === teacherIdCheck ? "teacher" : "student",
          conflictWith: aid,
          conflictAppointment: a
        };
      }
    }
  }

  return { clash: false };
}

// -------------------------------------------------------------
// POPUP OPEN
// -------------------------------------------------------------
async function openSchedulePopup(aid) {
  // Show popup
  document.getElementById("popupOverlay").style.display = "flex";
  const popupError = document.getElementById("popupError");
  popupError.style.display = "none";
  popupError.textContent = "";

  // Pre-fill values if appointment already has tentative values
  const appointmentRef = doc(db, "appointment", aid);
  const appointmentSnap = await getDoc(appointmentRef);
  const appointmentData = appointmentSnap.exists() ? appointmentSnap.data() : {};

  if (appointmentData.appDate) {
    document.getElementById("popupDate").value = appointmentData.appDate;
  } else {
    document.getElementById("popupDate").value = "";
  }
  document.getElementById("popupStart").value = appointmentData.startTime || "";
  document.getElementById("popupEnd").value = appointmentData.endTime || "";
  document.getElementById("popupMessage").value = appointmentData.tmessage || "";

  // submit handler
  document.getElementById("popupSubmit").onclick = async () => {
    popupError.style.display = "none";
    popupError.textContent = "";

    const date = document.getElementById("popupDate").value;
    const start = document.getElementById("popupStart").value;
    const end = document.getElementById("popupEnd").value;
    const message = document.getElementById("popupMessage").value || "";

    // Basic presence validation
    if (!date || !start || !end) {
      popupError.textContent = "Please fill all fields.";
      popupError.style.display = "block";
      return;
    }

    // Parse times
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);

    if (startMin === null || endMin === null) {
      popupError.textContent = "Invalid start or end time format.";
      popupError.style.display = "block";
      return;
    }

    if (endMin <= startMin) {
      popupError.textContent = "End time must be after start time.";
      popupError.style.display = "block";
      return;
    }

    const gap = endMin - startMin;

    // Gap constraints: min 30 mins, max 60 mins
    if (gap < 30) {
      popupError.textContent = "Minimum appointment duration is 30 minutes.";
      popupError.style.display = "block";
      return;
    }
    if (gap > 60) {
      popupError.textContent = "Maximum appointment duration is 60 minutes.";
      popupError.style.display = "block";
      return;
    }

    // Working hours restrictions:
    // Mon-Fri: allowed only from 16:00 (960) to 24:00 (1440)
    // Sat/Sun: allowed only from 07:00 (420) to 16:00 (960)
    const weekday = weekdayName(date); // 'Mon', ...
    const weekdayIndex = new Date(date + "T00:00:00").getDay(); // 0 Sun .. 6 Sat

    if (weekdayIndex >= 1 && weekdayIndex <= 5) {
      // Mon-Fri
      const allowedStart = 16 * 60; // 960
      const allowedEnd = 24 * 60; // 1440
      if (startMin < allowedStart || endMin > allowedEnd) {
        popupError.textContent = "On weekdays (Mon-Fri) appointments are allowed only between 16:00 and 24:00.";
        popupError.style.display = "block";
        return;
      }
    } else {
      // Sat or Sun
      const allowedStart = 7 * 60; // 420
      const allowedEnd = 16 * 60; // 960
      if (startMin < allowedStart || endMin > allowedEnd) {
        popupError.textContent = "On weekends (Sat-Sun) appointments are allowed only between 07:00 and 16:00.";
        popupError.style.display = "block";
        return;
      }
    }

    // Teacher availability check (availableDays array expected)
    const teacherAvail = await getTeacherAvailability(teacherId);
    if (teacherAvail === null) {
      popupError.textContent = "Unable to read teacher availability. Please try again.";
      popupError.style.display = "block";
      return;
    }
    // Normalize comparisons to short day names like 'Mon','Tue' etc.
    const normalizedAvail = teacherAvail.map(d => String(d).slice(0,3));
    if (!normalizedAvail.includes(String(weekday).slice(0,3))) {
      popupError.textContent = `Teacher is not available on ${weekday}.`;
      popupError.style.display = "block";
      return;
    }

    // Student id for this appointment
    const sid = appointmentData.sid;

    // Clash checks: teacher and student on same date
    const clashResult = await hasClash({
      date,
      startMin,
      endMin,
      teacherIdCheck: teacherId,
      studentIdCheck: sid,
      excludeAid: aid
    });

    if (clashResult.clash) {
      if (clashResult.reason === "teacher") {
        popupError.textContent = "Selected time clashes with another appointment of the teacher.";
      } else {
        popupError.textContent = "Selected time clashes with another appointment of the student.";
      }
      popupError.style.display = "block";
      return;
    }

    // All validations passed → update appointment
    try {
      await updateDoc(doc(db, "appointment", aid), {
        appDate: date,
        startTime: start,
        endTime: end,
        status: "k",     // scheduled/confirmed
        tmessage: message
      });
    } catch (err) {
      console.error("Error updating appointment:", err);
      popupError.textContent = "Failed to schedule appointment. Please try again.";
      popupError.style.display = "block";
      return;
    }

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
  // clear any error shown previously
  const popupError = document.getElementById("popupError");
  if (popupError) {
    popupError.style.display = "none";
    popupError.textContent = "";
  }
}

loadAppointments();
