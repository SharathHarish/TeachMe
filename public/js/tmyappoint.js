import { db } from "../js/firebase.js";
import {
  collection,
  getDocs,
  query,
  where
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

    // Fetch name + class from studentMap
    const sInfo = studentMap[data.sid] || {};

    const studentName = sInfo.sname || "-";
    const studentClass = sInfo.sclass || "-";

    // Message comes directly from APPOINTMENT
    const studentMessage = data.message || "-";

    // Handle empty date
    const appDate =
      data.appDate && data.appDate.trim() !== ""
        ? data.appDate
        : "Yet to be scheduled";

    // Button logic
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

  // Attach button events
  document.querySelectorAll(".completeBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const aid = btn.dataset.docid; // aid in appointment doc
      window.location.href = `tmyappoint.html?aid=${aid}`;
    });
  });
}

loadAppointments();
