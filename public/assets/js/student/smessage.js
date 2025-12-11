// smessage.js
import { db } from "../js/firebase.js";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// -------------------------------------------------------
// 1️⃣ Extract AID (field value) from URL
// -------------------------------------------------------
const urlParams = new URLSearchParams(window.location.search);
const appointmentAid = urlParams.get("aid");

console.log("Extracted AID =", appointmentAid);

if (!appointmentAid) {
  alert("Invalid appointment reference.");
  throw new Error("No appointment AID found in URL");
}

// -------------------------------------------------------
// 2️⃣ DOM Elements
// -------------------------------------------------------
const popup = document.getElementById("messagePopup");
const popupSendBtn = document.getElementById("popupSendBtn");
const popupCloseBtn = document.getElementById("popupCloseBtn");
const popupMessage = document.getElementById("popupMessage");

// Show popup
popup.style.display = "flex";

// Close popup → back to appointment list
popupCloseBtn.addEventListener("click", () => {
  window.location.href = "smyappoint.html";
});

// -------------------------------------------------------
// 3️⃣ SEND MESSAGE → UPDATE Firestore BY AID
// -------------------------------------------------------
popupSendBtn.addEventListener("click", async () => {
  const msg = popupMessage.value.trim();

  if (msg === "") {
    alert("Message cannot be empty.");
    return;
  }

  try {

    // ⭐ Query Firestore based on AID field
    const q = query(
      collection(db, "appointment"),
      where("aid", "==", appointmentAid)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Appointment not found!");
      return;
    }

    // Get actual Firestore document ID
    const docId = snap.docs[0].id;
    const appointmentRef = doc(db, "appointment", docId);

    // ⭐ Update Firestore
    await updateDoc(appointmentRef, {
      messages: msg,   // store string
      status: "s"      // update status
    });

    alert("Message sent successfully!");
    window.location.href = "sbookappoint.html";

  } catch (err) {
    console.error("Error sending message:", err);
    alert("Error sending message.");
  }
});
