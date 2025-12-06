import { onAuth, getUserDoc, logout } from "./auth.js";
import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc, query, where,
  updateDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const s = document.getElementById("studentSection");
const t = document.getElementById("teacherSection");
const a = document.getElementById("adminSection");
const logoutBtn = document.getElementById("logoutBtn");
const teacherList = document.getElementById("teacherList");
const bookingList = document.getElementById("bookingList");
const studentBookings = document.getElementById("studentBookings");

let currentUser = null;
let currentRole = null;

// ✅ Auth Check
onAuth(async user => {
  if (!user) return location.href = "login.html";
  currentUser = user;
  const data = await getUserDoc(user.uid);
  currentRole = data?.role || "student";

  s.style.display = currentRole === "student" ? "block" : "none";
  t.style.display = currentRole === "teacher" ? "block" : "none";
  a.style.display = currentRole === "admin" ? "block" : "none";

  if (currentRole === "student") {
    loadTeachers();
    loadStudentBookings(user.uid);
  }
  if (currentRole === "teacher") {
    loadTeacherBookings(user.uid);
  }
});

// ✅ Logout
logoutBtn.addEventListener("click", async () => {
  await logout();
  location.href = "login.html";
});

// ==================== Student Functions ====================
async function loadTeachers() {
  teacherList.innerHTML = "Loading...";
  const snap = await getDocs(collection(db, "teachers"));
  let html = "";
  snap.forEach(d => {
    const data = d.data();
    html += `<li>${data.name} (${data.subject})
      <button onclick="bookTeacher('${d.id}','${data.name}')">Book</button>
    </li>`;
  });
  teacherList.innerHTML = html || "No teachers available.";
}

// ✅ Book Teacher
window.bookTeacher = async (teacherId, teacherName) => {
  const studentDoc = await getUserDoc(currentUser.uid);
  await addDoc(collection(db, "bookings"), {
    studentId: currentUser.uid,
    studentName: studentDoc.name,
    teacherId,
    teacherName,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  alert("Booking request sent!");
};

// ✅ Load Student Bookings in realtime
function loadStudentBookings(studentId) {
  const q = query(collection(db, "bookings"), where("studentId", "==", studentId));
  onSnapshot(q, snap => {
    studentBookings.innerHTML = "";
    snap.forEach(d => {
      const data = d.data();
      const li = document.createElement("li");
      li.textContent = `${data.teacherName} → ${data.status}`;
      studentBookings.appendChild(li);
    });
    if (!snap.size) studentBookings.innerHTML = "No bookings yet.";
  });
}

// ==================== Teacher Functions ====================
function loadTeacherBookings(teacherId) {
  const q = query(collection(db, "bookings"), where("teacherId", "==", teacherId));
  onSnapshot(q, snap => {
    bookingList.innerHTML = "";
    snap.forEach(d => {
      const data = d.data();
      bookingList.innerHTML += `<li>${data.studentName} → ${data.status}
        <button onclick="approveBooking('${d.id}')">Approve</button>
        <button onclick="cancelBooking('${d.id}')">Cancel</button>
      </li>`;
    });
    if (!snap.size) bookingList.innerHTML = "No bookings yet.";
  });
}

// ✅ Approve Booking
window.approveBooking = async (id) => {
  await updateDoc(doc(db, "bookings", id), { status: "approved" });
};

// ✅ Cancel Booking
window.cancelBooking = async (id) => {
  await updateDoc(doc(db, "bookings", id), { status: "cancelled" });
};
