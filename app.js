/* -------------------- FIREBASE IMPORTS -------------------- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

/* -------------------- FIREBASE CONFIG -------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCFG06b4ui99LAFAsn1-ZylJQFng99C9nI",
  authDomain: "chat-app-c26ed.firebaseapp.com",
  databaseURL: "https://chat-app-c26ed-default-rtdb.firebaseio.com",
  projectId: "chat-app-c26ed",
  storageBucket: "chat-app-c26ed.appspot.com",
  messagingSenderId: "688317573161",
  appId: "1:688317573161:web:7f54c20bec25521687d438",
  measurementId: "G-QG72FQ39V9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* -------------------- SweetAlert Style -------------------- */
const alertStyle = {
  background: "linear-gradient(145deg, #1a0026, #25003a)",
  color: "#ffccff",
  confirmButtonColor: "#ff007f",
  backdrop: `rgba(0,0,0,0.75)`,
  allowOutsideClick: false,
  allowEscapeKey: true,
  customClass: { popup: "neon-alert" }
};

/* -------------------- POPUPS -------------------- */
const signupPopup = document.getElementById("signupPopup");
const loginPopup = document.getElementById("loginPopup");
const popupOverlay = document.getElementById("popupOverlay");

/* ✅ FIXED POPUP SHOW/HIDE */
function showPopup(popup) {
  Swal.close();
  popup.style.display = "flex";
  popup.style.zIndex = "9999";
  popup.classList.add("myPopup", "show");
}

function hidePopup(popup) {
  popup.style.display = "none";
  popup.classList.remove("show");
}

/* -------------------- GLOBAL CLOSE -------------------- */
window.addEventListener("click", (e) => {
  if (e.target === signupPopup) hidePopup(signupPopup);
  if (e.target === loginPopup) hidePopup(loginPopup);
  if (e.target === popupOverlay) popupOverlay.style.display = "none";
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hidePopup(signupPopup);
    hidePopup(loginPopup);
    popupOverlay.style.display = "none";
    Swal.close();
  }
});

/* -------------------- OPEN BUTTONS -------------------- */
document.querySelector(".signup-btn")?.addEventListener("click", () => showPopup(signupPopup));
document.querySelector(".login-btn")?.addEventListener("click", () => showPopup(loginPopup));

/* -------------------- SIGNUP -------------------- */
document.getElementById("sign-btn-popup")?.addEventListener("click", () => {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!email || !password) {
    return Swal.fire({
      title: "⚠ Missing Info",
      text: "Please enter both email and password!",
      icon: "warning",
      confirmButtonText: "OK",
      ...alertStyle
    });
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      hidePopup(signupPopup);

      Swal.fire({
        title: "🎉 Account Created",
        text: "Welcome!",
        icon: "success",
        confirmButtonText: "OK",
        ...alertStyle
      }).then(() => window.location.href = "user.html");
    })
    .catch((err) => {
      Swal.fire({
        title: "Signup Failed",
        text: err.message,
        icon: "error",
        confirmButtonText: "Try Again",
        ...alertStyle
      });
    });
});

/* -------------------- LOGIN -------------------- */
document.getElementById("login-btn-popup")?.addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    return Swal.fire({
      title: "⚠ Missing Info",
      text: "Enter both email and password.",
      icon: "warning",
      confirmButtonText: "OK",
      ...alertStyle
    });
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      hidePopup(loginPopup);

      Swal.fire({
        title: "✅ Login Successful",
        text: "Welcome back!",
        icon: "success",
        confirmButtonText: "OK",
        ...alertStyle
      }).then(() => window.location.href = "user.html");
    })
    .catch((err) => {
      Swal.fire({
        title: "Login Failed",
        text: err.message,
        icon: "error",
        confirmButtonText: "Try Again",
        ...alertStyle
      });
    });
});

/* -------------------- USERNAME SAVE -------------------- */
document.getElementById("submit")?.addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();

  if (!name) {
    return Swal.fire({
      title: "⚠ Name Required",
      text: "Please enter your name!",
      icon: "warning",
      confirmButtonText: "OK",
      ...alertStyle
    });
  }

  localStorage.setItem("chatUser", name);

  Swal.fire({
    title: "✔ Saved",
    text: "Start chatting!",
    icon: "success",
    confirmButtonText: "OK",
    ...alertStyle
  }).then(() => {
    window.location.href = "chat.html";
  });
});

/* -------------------- CHAT SYSTEM -------------------- */
const chatBox = document.getElementById("ChatMessage");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("text");

if (chatBox && sendBtn) {
  const username = localStorage.getItem("chatUser");
  if (!username) window.location.href = "user.html";

  sendBtn.addEventListener("click", () => {
    const msg = messageInput.value.trim();
    if (!msg) {
      return Swal.fire({
        title: "💬 Empty Message",
        text: "Write something.",
        icon: "info",
        confirmButtonText: "OK",
        ...alertStyle
      });
    }

    push(ref(db, "messages"), {
      name: username,
      text: msg,
      time: new Date().toLocaleTimeString(),
      edited: false
    });

    messageInput.value = "";
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendBtn.click();
  });

  onValue(ref(db, "messages"), (snapshot) => {
    chatBox.innerHTML = "";

    if (!snapshot.exists()) {
      chatBox.innerHTML = `<p>No messages yet.</p>`;
      return;
    }

    snapshot.forEach((child) => {
      const data = child.val();
      const id = child.key;
      const isMe = data.name === username;

      const div = document.createElement("div");
      div.classList.add("message", isMe ? "right" : "left");

      div.innerHTML = `
        ${!isMe ? `<div class="user-initial">${data.name[0].toUpperCase()}</div>` : ""}
        <div class="msg-box">
          ${data.edited ? `<span class="edited-label">Edited</span>` : ""}
          <p class="msg-sender"><strong>${data.name}</strong></p>
          <p class="msg-text">${escapeHtml(data.text)}</p>
          <span class="time">${data.time}</span>
          ${
            isMe
              ? `<div class="icons">
                   <button class="edit" data-id="${id}">✏️</button>
                   <button class="delete" data-id="${id}">🗑️</button>
                 </div>`
              : ""
          }
        </div>
      `;

      chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });

  chatBox.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;

    if (btn.classList.contains("delete")) {
      Swal.fire({
        title: "🗑 Delete Message?",
        text: "This cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        ...alertStyle
      }).then((res) => {
        if (res.isConfirmed) remove(ref(db, "messages/" + id));
      });
    }

    if (btn.classList.contains("edit")) {
      Swal.fire({
        title: "✏️ Edit Message",
        input: "text",
        inputPlaceholder: "New message...",
        showCancelButton: true,
        confirmButtonText: "Update",
        ...alertStyle
      }).then((res) => {
        if (res.isConfirmed && res.value.trim()) {
          update(ref(db, "messages/" + id), {
            text: res.value.trim(),
            time: new Date().toLocaleTimeString(),
            edited: true
          });
        }
      });
    }
  });
}

/* -------------------- RATING SYSTEM -------------------- */
const submitRating = document.getElementById("submitRating");
const stars = document.querySelectorAll("#starRating span");
const ratingText = document.getElementById("ratingText");
let selectedRating = 0;

document.getElementById("logchat")?.addEventListener("click", (e) => {
  e.preventDefault();
  popupOverlay.style.display = "flex";
});

/* ⭐ Rating Click */
stars.forEach((star, i) => {
  star.addEventListener("click", () => {
    selectedRating = i + 1;

    stars.forEach((s) => s.classList.remove("active"));
    for (let j = 0; j <= i; j++) stars[j].classList.add("active");

    ratingText.textContent = ["Poor", "Fair", "Good", "Very Good", "Excellent"][i];
  });
});

/* ✅ Submit Rating (Fixed Alert OK Click) */
submitRating?.addEventListener("click", () => {
  if (selectedRating === 0) {
    popupOverlay.style.display = "none"; // 👈 Fix added here

    return Swal.fire({
      title: "⚠ No Rating",
      text: "Choose a star!",
      icon: "warning",
      confirmButtonText: "OK",
      ...alertStyle
    }).then(() => {
      popupOverlay.style.display = "flex"; // 👈 Reopen overlay safely
    });
  }

  push(ref(db, "feedback"), {
    username: localStorage.getItem("chatUser"),
    rating: selectedRating,
    time: new Date().toLocaleString()
  }).then(() => {
    popupOverlay.style.display = "none";

    Swal.fire({
      title: "🌟 Thank You!",
      icon: "success",
      confirmButtonText: "OK",
      ...alertStyle
    }).then(() => {
      signOut(auth);
      localStorage.removeItem("chatUser");
      window.location.href = "index.html";
    });
  });
});

/* -------------------- UTIL -------------------- */
function escapeHtml(text) {
  return (text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------- LOGOUT -------------------- */
document.getElementById("logout")?.addEventListener("click", () => {
  Swal.fire({
    title: "🚪 Log Out?",
    text: "Are you sure you want to log out?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Log Out",
    cancelButtonText: "Cancel",
    ...alertStyle
  }).then((res) => {
    if (res.isConfirmed) {
      signOut(auth)
        .then(() => {
          localStorage.removeItem("chatUser");
          Swal.fire({
            title: "👋 Logged Out",
            text: "See you soon!",
            icon: "success",
            confirmButtonText: "OK",
            ...alertStyle
          }).then(() => {
            window.location.href = "index.html";
          });
        })
        .catch((err) => {
          Swal.fire({
            title: "❌ Logout Failed",
            text: err.message,
            icon: "error",
            confirmButtonText: "OK",
            ...alertStyle
          });
        });
    }
  });
});
