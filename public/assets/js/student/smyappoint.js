import { db } from "../firebase/firebase.js";
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

    const appDate =
      data.appDate && data.appDate.trim() !== ""
        ? data.appDate
        : "Yet to be scheduled";

    let actionCell = "";

    if (data.status === "m") {
      actionCell = `
        <button class="btn-success completeBtn"
                data-aid="${data.aid}">
          Complete Appointment
        </button>
      `;
    }
    else if (data.status === "r") {
      actionCell = `
        <span style="color:red;font-weight:bold;">
          Appointment Rejected
        </span>
      `;
    }
    else if (data.status === "a") {
      actionCell = `
        <span style="color:green;font-weight:bold;">
          Appointment Accepted
        </span>
        <br>
        <span class="viewMessage"
              data-aid="${data.aid}"
              style="color:#2563eb;cursor:pointer;text-decoration:underline;font-size:13px;">
          Click to view teacher's message
        </span>
      `;
    }
    else if (data.status === "s") {
      actionCell = `
        <span style="color:blue;font-weight:bold;">
          Appointment Request Completed
        </span>
      `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${teacherName}</td>
      <td>${teacherDep}</td>
      <td>${teacherSub}</td>
      <td>${appDate}</td>
      <td>${data.startTime || "-"}</td>
      <td>${actionCell}</td>
    `;

    tbody.appendChild(tr);
  });

  // Complete Appointment Button
  document.querySelectorAll(".completeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const aid = btn.dataset.aid;
      window.location.href = `smyappoint.html?aid=${aid}`;
    });
  });

  // View Teacher Message
  document.querySelectorAll(".viewMessage").forEach(el => {
    el.addEventListener("click", () => {
      openTeacherMessage(el.dataset.aid);
    });
  });
}

// -------------------------------------------------------------
// Fetch Teacher Message USING aid FIELD (SAFE)
// -------------------------------------------------------------
async function openTeacherMessage(aid) {
  const modal = document.getElementById("messageModal");
  const text = document.getElementById("teacherMessageText");

  text.textContent = "Loading...";

  const q = query(
    collection(db, "appointment"),
    where("aid", "==", aid)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    const data = snap.docs[0].data();

    // 🔎 DEBUG (remove later if needed)
    console.log("Appointment data:", data);

    text.textContent = data.tmessage || "No message provided.";
  } else {
    text.textContent = "Message not found.";
  }

  modal.style.display = "flex";
}

// Close modal (global)
window.closeMessageModal = function () {
  document.getElementById("messageModal").style.display = "none";
};

loadAppointments();
