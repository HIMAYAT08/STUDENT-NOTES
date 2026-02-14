// script.js

// Global state
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users")) || {}; // Load from LocalStorage
let currentPlanDuration = "";
let dashboardTimerInterval = null;

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
  if (dashboardTimerInterval) clearInterval(dashboardTimerInterval);
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

  // Timer Logic
  const timerDisplay = document.getElementById("subscriptionTimer");
  const expiredWarning = document.getElementById("planExpiredWarning");

  if (dashboardTimerInterval) clearInterval(dashboardTimerInterval);

  if (user.subscriptionExpiry) {
    const startTimer = () => {
      const now = Date.now();
      const timeLeft = user.subscriptionExpiry - now;

      if (timeLeft <= 0) {
        timerDisplay.style.display = "none";
        expiredWarning.style.display = "block";
        clearInterval(dashboardTimerInterval);
      } else {
        expiredWarning.style.display = "none";
        timerDisplay.style.display = "block";
        
        const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        timerDisplay.textContent = `Plan Expires In: ${d}d ${h}h ${m}m ${s}s`;
      }
    };
    startTimer();
    dashboardTimerInterval = setInterval(startTimer, 1000);
  } else {
    if (timerDisplay) timerDisplay.style.display = "none";
    if (expiredWarning) expiredWarning.style.display = "none";
  }

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

// Selected Plan Logic
const selectedPlanOverlay = document.getElementById("selectedPlanOverlay");
const closeSelectedPlanBtn = document.getElementById("closeSelectedPlanBtn");
const payNowBtn = document.getElementById("payNowBtn");
const planPaidBtn = document.getElementById("planPaidBtn");
let currentPaymentLink = "";

function openPlanDetails(name, price, duration, benefit, link) {
  currentPlanDuration = duration;
  document.getElementById("selectedPlanName").innerText = name;
  document.getElementById("selectedPlanPrice").innerText = price;
  document.getElementById("selectedPlanDuration").innerText = duration;
  document.getElementById("selectedPlanBenefit").innerText = benefit;
  currentPaymentLink = link;

  // Reset buttons state
  payNowBtn.style.display = "block";
  planPaidBtn.style.display = "none";
  planPaidBtn.textContent = "I HAVE PAYED";
  planPaidBtn.disabled = false;

  selectedPlanOverlay.classList.add("active");
}

closeSelectedPlanBtn.addEventListener("click", function() {
  selectedPlanOverlay.classList.remove("active");
});

payNowBtn.addEventListener("click", function() {
  if (currentPaymentLink) {
    window.open(currentPaymentLink, "_blank");
    
    // Hide Pay button and show "I HAVE PAYED" after 20 seconds
    payNowBtn.style.display = "none";
    setTimeout(() => {
      planPaidBtn.style.display = "block";
    }, 20000);
  }
});

planPaidBtn.addEventListener("click", function() {
  const btn = this;
  let timeLeft = 30;
  btn.disabled = true;
  btn.textContent = `Verifying... ${timeLeft}s`;

  const timer = setInterval(() => {
    timeLeft--;
    btn.textContent = `Verifying... ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (currentUser && users[currentUser]) {
        users[currentUser].pagesRemaining = 100000; // Grant unlimited pages
        
        // Calculate Expiry
        const now = Date.now();
        let durationMs = 0;
        if (currentPlanDuration === "Half Day") {
          durationMs = 12 * 60 * 60 * 1000;
        } else {
          const days = parseInt(currentPlanDuration);
          if (!isNaN(days)) durationMs = days * 24 * 60 * 60 * 1000;
        }
        
        if (durationMs > 0) users[currentUser].subscriptionExpiry = now + durationMs;

        localStorage.setItem("users", JSON.stringify(users));
        updateDashboard();
        
        // Close Plan Overlay
        selectedPlanOverlay.classList.remove("active");

        // Show Congratulations Animation
        const congratsOverlay = document.getElementById("congratsOverlay");
        congratsOverlay.classList.add("active");

        // Hide after 4 seconds
        setTimeout(() => {
          congratsOverlay.classList.remove("active");
          document.getElementById("subscriptionOverlay").classList.remove("active");
          document.body.classList.remove("no-scroll");
        }, 4000);
      }
    }
  }, 1000);
});

// Customize Profile Logic
const customizeProfileBtn = document.getElementById("customizeProfileBtn");
const profileOverlay = document.getElementById("profileOverlay");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const profileForm = document.getElementById("profileForm");
const editUsername = document.getElementById("editUsername");
const editNewPassword = document.getElementById("editNewPassword");
const editConfirmPassword = document.getElementById("editConfirmPassword");

customizeProfileBtn.addEventListener("click", function() {
  if (!currentUser) return;
  editUsername.value = currentUser;
  editNewPassword.value = "";
  editConfirmPassword.value = "";
  profileOverlay.classList.add("active");
  closeSidebar();
});

cancelProfileBtn.addEventListener("click", function() {
  profileOverlay.classList.remove("active");
});

profileForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const newUsername = editUsername.value.trim();
  const newPassword = editNewPassword.value;
  const confirmPassword = editConfirmPassword.value;

  if (newPassword && newPassword !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (newUsername !== currentUser && users[newUsername]) {
    alert("Username already taken!");
    return;
  }

  const userData = users[currentUser];
  if (newPassword) userData.password = newPassword;
  
  if (newUsername !== currentUser) {
    users[newUsername] = userData;
    delete users[currentUser];
    currentUser = newUsername;
    localStorage.setItem("username", currentUser);
  }

  localStorage.setItem("users", JSON.stringify(users));
  updateSidebarProfile();
  alert("Profile updated successfully!");
  profileOverlay.classList.remove("active");
});

// Photo to PDF Logic
const photoToPdfMenuBtn = document.getElementById("photoToPdfMenuBtn");
const photoToPdfOverlay = document.getElementById("photoToPdfOverlay");
const closePhotoToPdfBtn = document.getElementById("closePhotoToPdfBtn");
const imageUploadInput = document.getElementById("imageUploadInput");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const generatePdfBtn = document.getElementById("generatePdfBtn");

let uploadedImages = [];

if (photoToPdfMenuBtn) {
  photoToPdfMenuBtn.addEventListener("click", function() {
    photoToPdfOverlay.classList.add("active");
    document.body.classList.add("no-scroll");
    closeSidebar();
  });
}

if (closePhotoToPdfBtn) {
  closePhotoToPdfBtn.addEventListener("click", function() {
    photoToPdfOverlay.classList.remove("active");
    document.body.classList.remove("no-scroll");
  });
}

if (imageUploadInput) {
  imageUploadInput.addEventListener("change", function(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      if (!file.type.startsWith("image/")) return;
      
      const reader = new FileReader();
      reader.onload = function(event) {
        uploadedImages.push(event.target.result);
        renderPreviews();
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = ""; // Reset input
  });
}

function renderPreviews() {
  imagePreviewContainer.innerHTML = "";
  if (uploadedImages.length > 0) {
    generatePdfBtn.style.display = "block";
  } else {
    generatePdfBtn.style.display = "none";
  }

  uploadedImages.forEach((imgSrc, index) => {
    const div = document.createElement("div");
    div.className = "preview-item";
    div.innerHTML = `<img src="${imgSrc}">`;
    div.title = "Click to remove";
    div.style.cursor = "pointer";
    div.onclick = () => {
      uploadedImages.splice(index, 1);
      renderPreviews();
    };
    imagePreviewContainer.appendChild(div);
  });
}

if (generatePdfBtn) {
  generatePdfBtn.addEventListener("click", function() {
    if (uploadedImages.length === 0) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    uploadedImages.forEach((imgData, i) => {
      if (i > 0) doc.addPage();
      
      const imgProps = doc.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      // Calculate ratio to fit A4
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const newWidth = imgWidth * ratio;
      const newHeight = imgHeight * ratio;
      
      // Center image
      const x = (pageWidth - newWidth) / 2;
      const y = (pageHeight - newHeight) / 2;
      
      // Detect format
      const format = imgData.match(/^data:image\/(\w+);base64,/)[1].toUpperCase();
      const finalFormat = format === 'JPG' ? 'JPEG' : format;

      doc.addImage(imgData, finalFormat, x, y, newWidth, newHeight);
    });
    
    doc.save("MyNotes.pdf");
  });
}
