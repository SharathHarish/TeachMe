// smyappoint.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const cardContainer = document.getElementById("appointmentsContainer");

// Popup elements
const popup = document.getElementById("messagePopup");
const popupMessageInput = document.getElementById("popupMessage");
const popupSendBtn = document.getElementById("popupSendBtn");
const popupCloseBtn = document.getElementById("popupCloseBtn");

let currentAID = null;

// ------------------------------------------------
// Load Teachers (needed to convert tid -> name)
// ------------------------------------------------
async function loadTeachersMap() {
  const snap = await getDocs(collection(db, "teachers"));
  
  const map = {};
  snap.docs.forEach(doc => {
    let t = doc.data();
    map[t.tid] = t.name;  // store teacher name by tid
  });

  return map;
}

// ------------------------------------------------
// Load Appointments
// ------------------------------------------------
async function loadAppointments() {
  const sid = sessionStorage.getItem("sid");

  if (!sid) {
    alert("User not logged in!");
    return;
  }

  const teacherMap = await loadTeachersMap(); // <-- NEW

  const snap = await getDocs(collection(db, "appointments"));
  
  const myAppointments = snap.docs.map(d => ({
    aid: d.id,
    ...d.data(),
    teacherName: teacherMap[d.data().tid] || "Unknown Teacher" // match name
  })).filter(a => a.sid === sid);

  renderCards(myAppointments);
}

// ------------------------------------------------
// Render cards with teacher name
// ------------------------------------------------
function renderCards(list) {
  cardContainer.innerHTML = "";

  if (list.length === 0) {
    cardContainer.innerHTML = `<p>No appointments found.</p>`;
    return;
  }

  list.forEach(a => {
    const card = `
      <div class="appoint-card">
        <h3>${a.teacherName}</h3>
        <p><b>Date:</b> ${a.appDate || "-"}</p>
        <p><b>Start:</b> ${a.startTime || "-"}</p>
        <p><b>End:</b> ${a.endTime || "-"}</p>
        <p><b>Message:</b> ${a.messages || "No messages yet"}</p>

        <button class="msgBtn" data-aid="${a.aid}">
            Send Message
        </button>
      </div>
    `;

    cardContainer.innerHTML += card;
  });

  document.querySelectorAll(".msgBtn").forEach(btn => {
    btn.addEventListener("click", openMessagePopup);
  });
}

// ------------------------------------------------
// Popup Open
// ------------------------------------------------
function openMessagePopup(e) {
  currentAID = e.target.getAttribute("data-aid");
  popupMessageInput.value = "";
  popup.style.display = "flex";
}

// ------------------------------------------------
// Popup Close
// ------------------------------------------------
popupCloseBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

// ------------------------------------------------
// Save message to Firestore
// ------------------------------------------------
popupSendBtn.addEventListener("click", async () => {
  const msg = popupMessageInput.value.trim();

  if (msg === "") {
    alert("Message cannot be empty.");
    return;
  }

  try {
    const ref = doc(db, "appointments", currentAID);

    await updateDoc(ref, {
      messages: msg
    });

    alert("Message sent!");
    popup.style.display = "none";

    loadAppointments(); // refresh

  } catch (err) {
    console.error(err);
    alert("Failed to send message.");
  }
});

// Load all on start
loadAppointments();
