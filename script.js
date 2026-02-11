// script.js

// Global state
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users")) || {}; // Load from LocalStorage

// Check Login Status on Load
window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const savedUsername = localStorage.getItem("username");

  if (isLoggedIn && savedUsername && users[savedUsername]) {
    currentUser = savedUsername;
    showSection("dashboard");
    document.getElementById("authWarning").style.display = "none";
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("signupBtn").style.display = "none";
    document.getElementById("menuBtn").style.display = "flex";
    updateDashboard();
    renderNotes();
    updateSidebarProfile();
  }
});

// Utility: Show/Hide sections
function showSection(sectionId) {
  document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
}

// Toggle Password Visibility
function setupPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input = document.getElementById(inputId);
  toggle.addEventListener("click", function() {
    const type = input.getAttribute("type") === "password" ? "text" : "password";
    input.setAttribute("type", type);
  });
}
setupPasswordToggle("toggleLoginPassword", "loginPassword");
setupPasswordToggle("toggleSignupPassword", "signupPassword");

// Handle Header Buttons
document.getElementById("loginBtn").addEventListener("click", () => showSection("loginSection"));
document.getElementById("signupBtn").addEventListener("click", () => showSection("signupSection"));
showSection("loginSection"); // Show login initially

// Login
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const loginError = document.getElementById("loginError");

  if (users[username] && users[username].password === password) {
    currentUser = username;
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", username);
    
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("signupBtn").style.display = "none";
    showSection("dashboard");
    document.getElementById("authWarning").style.display = "none";
    document.getElementById("menuBtn").style.display = "flex";
    updateDashboard();
    renderNotes();
    updateSidebarProfile();
    loginError.style.display = "none";
  } else {
    loginError.style.display = "block";
  }
});

// Signup
document.getElementById("signupForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value;
  const password = document.getElementById("signupPassword").value;
  const signupError = document.getElementById("signupError");

  if (password.length < 8) {
    signupError.style.display = "block";
    return;
  }
  signupError.style.display = "none";

  if (users[username]) {
    alert("Username already exists!");
  } else {
    users[username] = {
      password: password,
      notes: [],
      pagesUsed: 0,
      pagesRemaining: 20
    };
    localStorage.setItem("users", JSON.stringify(users)); // Save to LocalStorage
    alert("Signup successful! Please login.");
    showSection("loginSection");
  }
});

// Logout
document.getElementById("sidebarLogoutBtn").addEventListener("click", function() {
  currentUser = null;
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  
  document.getElementById("loginBtn").style.display = "inline-block";
  document.getElementById("signupBtn").style.display = "inline-block";
  showSection("loginSection");
  document.getElementById("authWarning").style.display = "block";
  document.getElementById("menuBtn").style.display = "none";
  closeSidebar();
});

// Add Note
document.getElementById("noteForm").addEventListener("submit", function(e) {
  e.preventDefault();
  if (!currentUser) return;

  const user = users[currentUser];
  if (user.pagesRemaining <= 0) {
    alert("Your pages are finished, so please make a payment.");
    document.getElementById("paymentSection").style.display = "block";
    return;
  }

  const noteName = document.getElementById("noteName").value;
  const noteLink = document.getElementById("noteLink").value;

  user.notes.push({ name: noteName, link: noteLink });
  user.pagesUsed++;
  user.pagesRemaining--;

  localStorage.setItem("users", JSON.stringify(users)); // Save to LocalStorage
  updateDashboard();
  renderNotes();
  document.getElementById("noteForm").reset();
});

// Render Notes
function renderNotes() {
  const user = users[currentUser];
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  user.notes.forEach(note => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = note.link;
    a.textContent = note.name;
    a.target = "_blank";
    li.appendChild(a);
    container.appendChild(li);
  });
}

// Update Dashboard
function updateDashboard() {
  const user = users[currentUser];
  document.getElementById("pagesUsed").textContent = user.pagesUsed;
  document.getElementById("pagesRemaining").textContent = user.pagesRemaining;

  const noteBtn = document.querySelector("#noteForm button");
  if (user.pagesRemaining <= 0) {
    document.getElementById("paymentSection").style.display = "block";
    document.getElementById("pageLimitWarning").style.display = "block";
    document.getElementById("pagesFinishedWarning").style.display = "block";
    if (noteBtn) noteBtn.disabled = true;
  } else {
    document.getElementById("paymentSection").style.display = "none";
    document.getElementById("pageLimitWarning").style.display = "none";
    document.getElementById("pagesFinishedWarning").style.display = "none";
    if (noteBtn) noteBtn.disabled = false;
  }
}

// Search Notes
document.getElementById("searchInput").addEventListener("input", function() {
  const query = this.value.toLowerCase();
  const user = users[currentUser];
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  user.notes
    .filter(note => note.name.toLowerCase().includes(query))
    .forEach(note => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = note.link;
      a.textContent = note.name;
      a.target = "_blank";
      li.appendChild(a);
      container.appendChild(li);
    });
});

// Payment Verification Logic
document.getElementById("simulatePaymentBtn").addEventListener("click", function() {
  const btn = this;
  let timeLeft = 30;
  btn.disabled = true;
  btn.textContent = `Verifying... ${timeLeft}s`;

  const timer = setInterval(() => {
    timeLeft--;
    btn.textContent = `Verifying... ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      const user = users[currentUser];
      user.pagesRemaining += 20;
      localStorage.setItem("users", JSON.stringify(users));
      
      document.getElementById("paymentSuccessMsg").style.display = "block";
      setTimeout(() => {
        document.getElementById("paymentSuccessMsg").style.display = "none";
      }, 5000);
      
      btn.style.display = "none"; // Hide button again
      btn.textContent = "I Have Paid";
      btn.disabled = false;
      updateDashboard();
    }
  }, 1000);
});

function payNow() {
  window.open("https://imjo.in/pGsBYU", "_blank");
  setTimeout(() => {
    document.getElementById("simulatePaymentBtn").style.display = "block";
  }, 5000);
}

// Sidebar Logic
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
  sidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
}

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
}

menuBtn.addEventListener("click", openSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// Update Sidebar Profile
function updateSidebarProfile() {
  if (currentUser) {
    document.getElementById("sidebarProfileName").innerText = "Welcome, " + currentUser;
    // Optional: Update profile pic initial
    document.querySelector(".profile-pic").innerText = currentUser.charAt(0).toUpperCase();
  }
}

// Subscription Overlay Logic
const subscriptionOverlay = document.getElementById("subscriptionOverlay");

document.getElementById("subscriptionMenuBtn").addEventListener("click", function() {
  subscriptionOverlay.classList.add("active");
  document.body.classList.add("no-scroll");
  closeSidebar(); // Close sidebar when opening overlay
});

document.getElementById("closeSubscriptionBtn").addEventListener("click", function() {
  subscriptionOverlay.classList.remove("active");
  document.body.classList.remove("no-scroll");
});

// Settings Dropdown Logic
const settingsHeader = document.getElementById("settingsHeader");
const settingsDropdown = document.getElementById("settingsDropdown");
const arrow = document.querySelector(".arrow");

settingsHeader.addEventListener("click", function() {
  settingsDropdown.classList.toggle("open");
  arrow.style.transform = settingsDropdown.classList.contains("open") ? "rotate(180deg)" : "rotate(0deg)";
});
