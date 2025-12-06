import { register } from "./auth.js";

const regForm = document.getElementById("regForm");

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("rname").value.trim();
  const email = document.getElementById("remail").value.trim();
  const password = document.getElementById("rpass").value;
  try {
    await register(email, password, name || "User");
    location.href = "dashboard.html";
  } catch (err) {
    alert(err.message);
  }
});
