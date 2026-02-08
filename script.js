// script.js

// Global state
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users")) || {}; // Load from LocalStorage

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

// Login
document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  const loginError = document.getElementById("loginError");

  if (users[username] && users[username].password === password) {
    currentUser = username;
    document.getElementById("logoutBtn").style.display = "inline-block";
    showSection("dashboard");
    document.getElementById("authWarning").style.display = "none";
    updateDashboard();
    renderNotes();
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
document.getElementById("logoutBtn").addEventListener("click", function() {
  currentUser = null;
  document.getElementById("logoutBtn").style.display = "none";
  showSection("loginSection");
  document.getElementById("authWarning").style.display = "block";
});

// Add Note
document.getElementById("noteForm").addEventListener("submit", function(e) {
  e.preventDefault();
  if (!currentUser) return;

  const user = users[currentUser];
  if (user.pagesRemaining <= 0) {
    alert("You have used all free pages. Please pay to unlock more.");
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

  if (user.pagesRemaining <= 0) {
    document.getElementById("paymentSection").style.display = "block";
  } else {
    document.getElementById("paymentSection").style.display = "none";
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

// Payment Simulation
document.getElementById("simulatePaymentBtn").addEventListener("click", function() {
  const btn = this;
  let timeLeft = 30;
  btn.textContent = `Please wait ${timeLeft} seconds...`;
  btn.disabled = true;

  const timer = setInterval(function() {
    timeLeft--;
    btn.textContent = `Please wait ${timeLeft} seconds...`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      const user = users[currentUser];
      user.pagesRemaining = 100;
      localStorage.setItem("users", JSON.stringify(users)); // Save to LocalStorage
      
      // Update counters
      document.getElementById("pagesRemaining").textContent = user.pagesRemaining;

      // Show success message in the payment box
      const paymentSection = document.getElementById("paymentSection");
      paymentSection.innerHTML = '<h3 style="color: green; text-align: center;">Congratulations! You have successfully received 100 pages.</h3>';
    }
  }, 1000);
});