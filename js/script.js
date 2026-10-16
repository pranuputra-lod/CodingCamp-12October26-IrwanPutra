
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}


function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Gagal menyimpan data:", error);
  }
}


const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

themeToggle.addEventListener("click", function () {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  saveData("theme", next);
});

applyTheme(loadData("theme", "light"));


const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting");
const greetingEmojiEl = document.getElementById("greeting-emoji");
const quoteEl = document.getElementById("quote");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");

let userName = loadData("userName", "");
nameInput.value = userName;

function getGreeting(hour) {
  if (hour >= 5 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}


function getGreetingEmoji(hour) {
  if (hour >= 5 && hour < 11) return "🌅";
  if (hour >= 11 && hour < 15) return "☀️";
  if (hour >= 15 && hour < 18) return "🌇";
  return "🌙";
}


const quotes = [
  "Mulai saja dulu, sempurnakan nanti.",
  "Langkah kecil setiap hari lebih baik daripada diam.",
  "Fokus pada satu hal, selesaikan dengan baik.",
  "Hari ini adalah kesempatan baru untuk berkembang.",
  "Konsisten mengalahkan motivasi sesaat.",
  "Satu tugas selesai, satu beban berkurang.",
  "Istirahat itu bagian dari produktif.",
];

function getDailyQuote(date) {
  const dayNumber = Math.floor(date.getTime() / 86400000);
  return quotes[dayNumber % quotes.length];
}

function updateClock() {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).replace(/\./g, ":");

  dateEl.textContent = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const greeting = getGreeting(now.getHours());
  greetingEl.textContent = userName ? greeting + ", " + userName + "!" : greeting + "!";
  greetingEmojiEl.textContent = getGreetingEmoji(now.getHours());
  quoteEl.textContent = "“" + getDailyQuote(now) + "”";
}

nameForm.addEventListener("submit", function (event) {
  event.preventDefault(); 
  userName = nameInput.value.trim();
  saveData("userName", userName);
  updateClock();
});

updateClock();
setInterval(updateClock, 1000);


const timerDisplay = document.getElementById("timer-display");
const timerMessage = document.getElementById("timer-message");
const startBtn = document.getElementById("timer-start");
const stopBtn = document.getElementById("timer-stop");
const resetBtn = document.getElementById("timer-reset");
const timerForm = document.getElementById("timer-form");
const timerMinutesInput = document.getElementById("timer-minutes");
const timerStatus = document.getElementById("timer-status");
const ringFg = document.getElementById("ring-fg");
const RING_LENGTH = 2 * Math.PI * 52; 

let timerMinutes = loadData("timerMinutes", 25);
let secondsLeft = timerMinutes * 60;
let timerId = null;

timerMinutesInput.value = timerMinutes;

function renderTimer() {
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  timerDisplay.textContent = minutes + ":" + seconds;

  
  const totalSeconds = timerMinutes * 60;
  const fractionLeft = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  ringFg.style.strokeDashoffset = RING_LENGTH * (1 - fractionLeft);
  ringFg.classList.toggle("finished", secondsLeft <= 0);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
  if (secondsLeft > 0) {
    timerStatus.textContent = secondsLeft === timerMinutes * 60 ? "Siap fokus" : "Dijeda";
  }
}

function startTimer() {
  if (timerId !== null || secondsLeft <= 0) return; 
  timerMessage.textContent = "";
  timerStatus.textContent = "Sedang fokus 🔥";
  timerId = setInterval(function () {
    secondsLeft--;
    renderTimer();
    if (secondsLeft <= 0) {
      stopTimer();
      timerStatus.textContent = "Selesai!";
      timerMessage.textContent = "Waktu fokus selesai! Saatnya istirahat 🎉";
    }
  }, 1000);
}

function resetTimer() {
  stopTimer();
  secondsLeft = timerMinutes * 60;
  timerMessage.textContent = "";
  timerStatus.textContent = "Siap fokus";
  renderTimer();
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);


timerForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const value = parseInt(timerMinutesInput.value, 10);
  if (isNaN(value) || value < 1 || value > 120) {
    timerMessage.textContent = "Masukkan angka 1 - 120 menit.";
    return;
  }
  timerMinutes = value;
  saveData("timerMinutes", timerMinutes);
  resetTimer();
});

renderTimer();


const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoMessage = document.getElementById("todo-message");
const todoEmpty = document.getElementById("todo-empty");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");


let todos = loadData("todos", []);
let editingId = null; 


function isDuplicate(text, excludeId) {
  const target = text.trim().toLowerCase();
  return todos.some(function (todo) {
    return todo.id !== excludeId && todo.text.trim().toLowerCase() === target;
  });
}

function renderTodos() {
  todoList.innerHTML = "";
  todoEmpty.style.display = todos.length === 0 ? "block" : "none";

  
  const doneCount = todos.filter(function (item) { return item.done; }).length;
  const percent = todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100);
  progressText.textContent = doneCount + " dari " + todos.length + " selesai (" + percent + "%)";
  progressFill.style.width = percent + "%";

  todos.forEach(function (todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");

    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.setAttribute("aria-label", "Tandai selesai: " + todo.text);
    checkbox.addEventListener("change", function () {
      todo.done = checkbox.checked;
      saveData("todos", todos);
      renderTodos();
    });
    li.appendChild(checkbox);

    if (editingId === todo.id) {
      
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "todo-edit-input";
      editInput.value = todo.text;
      editInput.maxLength = 100;
      li.appendChild(editInput);

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "icon-btn";
      saveBtn.textContent = "Simpan";
      saveBtn.addEventListener("click", function () {
        const newText = editInput.value.trim();
        if (newText === "") {
          todoMessage.textContent = "Tugas tidak boleh kosong.";
          return;
        }
        if (isDuplicate(newText, todo.id)) {
          todoMessage.textContent = "Tugas itu sudah ada di daftar.";
          return;
        }
        todo.text = newText;
        editingId = null;
        todoMessage.textContent = "";
        saveData("todos", todos);
        renderTodos();
      });
      li.appendChild(saveBtn);

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "icon-btn";
      cancelBtn.textContent = "Batal";
      cancelBtn.addEventListener("click", function () {
        editingId = null;
        todoMessage.textContent = "";
        renderTodos();
      });
      li.appendChild(cancelBtn);

      
      editInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") saveBtn.click();
        if (event.key === "Escape") cancelBtn.click();
      });
      setTimeout(function () { editInput.focus(); }, 0);
    } else {
      
      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text; 
      li.appendChild(span);

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        editingId = todo.id;
        todoMessage.textContent = "";
        renderTodos();
      });
      li.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "icon-btn delete";
      deleteBtn.textContent = "Hapus";
      deleteBtn.addEventListener("click", function () {
        todos = todos.filter(function (item) { return item.id !== todo.id; });
        saveData("todos", todos);
        renderTodos();
      });
      li.appendChild(deleteBtn);
    }

    todoList.appendChild(li);
  });
}

todoForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (text === "") {
    todoMessage.textContent = "Tulis tugasnya dulu ya.";
    return;
  }
  if (isDuplicate(text, null)) {
    todoMessage.textContent = "Tugas itu sudah ada di daftar.";
    return;
  }

  todos.push({ id: Date.now(), text: text, done: false });
  saveData("todos", todos);
  todoInput.value = "";
  todoMessage.textContent = "";
  renderTodos();
});

renderTodos();


const linkForm = document.getElementById("link-form");
const linkNameInput = document.getElementById("link-name");
const linkUrlInput = document.getElementById("link-url");
const linkList = document.getElementById("link-list");
const linkMessage = document.getElementById("link-message");


let links = loadData("links", [
  { id: 1, name: "Google", url: "https://www.google.com" },
  { id: 2, name: "YouTube", url: "https://www.youtube.com" },
  { id: 3, name: "GitHub", url: "https://github.com" },
]);


function normalizeUrl(value) {
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : "https://" + url;
}

function renderLinks() {
  linkList.innerHTML = "";

  links.forEach(function (link) {
    const wrapper = document.createElement("div");
    wrapper.className = "link-item";

    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    
    const icon = document.createElement("img");
    icon.className = "link-icon";
    icon.alt = "";
    icon.src = "https://www.google.com/s2/favicons?sz=64&domain_url=" + encodeURIComponent(link.url);
    icon.addEventListener("error", function () { icon.style.display = "none"; });
    anchor.appendChild(icon);

    anchor.appendChild(document.createTextNode(link.name));
    wrapper.appendChild(anchor);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "✕";
    removeBtn.setAttribute("aria-label", "Hapus link " + link.name);
    removeBtn.addEventListener("click", function () {
      links = links.filter(function (item) { return item.id !== link.id; });
      saveData("links", links);
      renderLinks();
    });
    wrapper.appendChild(removeBtn);

    linkList.appendChild(wrapper);
  });
}

linkForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const name = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();

  if (name === "" || rawUrl === "") {
    linkMessage.textContent = "Nama dan alamat website harus diisi.";
    return;
  }

  const url = normalizeUrl(rawUrl);
  try {
    new URL(url); 
  } catch (error) {
    linkMessage.textContent = "Alamat website tidak valid.";
    return;
  }

  links.push({ id: Date.now(), name: name, url: url });
  saveData("links", links);
  linkNameInput.value = "";
  linkUrlInput.value = "";
  linkMessage.textContent = "";
  renderLinks();
});

renderLinks();
