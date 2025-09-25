const inputBox = document.getElementById("input-box");
const dueDateInput = document.getElementById("due-date");
const repeatSelect = document.getElementById("repeat-select");
const activeList = document.getElementById("active-list");
const completedList = document.getElementById("completed-list");
const activeToggle = document.getElementById("active-toggle");
const completedToggle = document.getElementById("completed-toggle");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const savedDarkMode = localStorage.getItem("darkMode") === "enabled";

let allLists = JSON.parse(localStorage.getItem("allLists")) || { "Default": [] };
let currentListName = localStorage.getItem("currentListName") || "Default";
let activeVisible = true;
let completedVisible = true;

function saveData() {
  localStorage.setItem("allLists", JSON.stringify(allLists));
  localStorage.setItem("currentListName", currentListName);
}

function addTask() {
  if (inputBox.value.trim() === "") {
    alert("You must write something!");
    return;
  }

  const repeatOption = repeatSelect.value;
  const dueDate = dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null;

  const task = {
    text: inputBox.value.trim(),
    completed: false,
    important: false,
    repeat: repeatOption,
    nextRepeatDate: getNextRepeatDate(repeatOption)?.toISOString() || null,
    completedAt: null,
    dueDate: dueDate
  };

  allLists[currentListName].push(task);
  inputBox.value = "";
  dueDateInput.value = "";
  repeatSelect.value = "none";
  saveData();
  updateUI();
}

function getNextRepeatDate(repeatOption) {
  const today = new Date();
  let nextRepeatDate = new Date(today);

  if (repeatOption === "daily") {
    nextRepeatDate.setDate(today.getDate() + 1);
  } else if (repeatOption === "weekly") {
    nextRepeatDate.setDate(today.getDate() + 7);
  } else if (repeatOption === "monthly") {
    nextRepeatDate.setMonth(today.getMonth() + 1);
  } else {
    return null;
  }

  return nextRepeatDate;
}

function toggleTask(index) {
  const task = allLists[currentListName][index];
  task.completed = !task.completed;

  if (task.completed) {
    task.completedAt = new Date().toLocaleString();

    if (task.repeat !== "none") {
      const newDue = getNextRepeatDate(task.repeat);
      task.dueDate = newDue.toISOString();
      task.nextRepeatDate = getNextRepeatDate(task.repeat).toISOString();
    }
  } else {
    task.completedAt = null;
  }

  saveData();
  updateUI();
}

function removeTask(index) {
  allLists[currentListName].splice(index, 1);
  saveData();
  updateUI();
}

function updateUI() {
  activeList.innerHTML = "";
  completedList.innerHTML = "";

  const tasks = allLists[currentListName] || [];
  let activeCount = 0;
  let completedCount = 0;

  tasks.forEach((task, index) => {
    if (task.repeat !== "none" && task.nextRepeatDate && new Date() >= new Date(task.nextRepeatDate)) {
      task.nextRepeatDate = getNextRepeatDate(task.repeat).toISOString();

      allLists[currentListName].push({
        ...task,
        completed: false,
        completedAt: null,
        dueDate: getNextRepeatDate(task.repeat).toISOString()
      });

      saveData();
    }

    const li = document.createElement("li");
    li.textContent = task.text;

    if (task.repeat === "daily") li.classList.add("repeat-daily");
    else if (task.repeat === "weekly") li.classList.add("repeat-weekly");
    else if (task.repeat === "monthly") li.classList.add("repeat-monthly");

    if (task.completed) {
      li.classList.add("checked");
      completedCount++;
    } else {
      activeCount++;
    }

    if (task.repeat !== "none") {
      const repeatIndicator = document.createElement("span");
      repeatIndicator.classList.add("repeat-indicator");
      repeatIndicator.textContent = task.repeat;
      li.appendChild(repeatIndicator);
    }

    if (task.dueDate) {
      const dueDateObj = new Date(task.dueDate);
      const now = new Date();
      const dueSpan = document.createElement("div");
      dueSpan.classList.add("due-time");
      dueSpan.textContent = `Due: ${dueDateObj.toLocaleString()}`;
      if (!task.completed && dueDateObj < now) dueSpan.classList.add("overdue");
      li.appendChild(dueSpan);
    }

    if (task.completed && task.completedAt) {
      const timestamp = document.createElement("div");
      timestamp.textContent = `Completed at: ${task.completedAt}`;
      timestamp.classList.add("completed-time");
      li.appendChild(timestamp);
    }

    li.addEventListener("click", () => toggleTask(index));

    const star = document.createElement("span");
    star.innerHTML = "★";
    star.classList.add("important-btn");
    if (task.important) star.classList.add("important");
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      task.important = !task.important;
      saveData();
      updateUI();
    });
    li.appendChild(star);

    const del = document.createElement("span");
    del.textContent = "\u00D7";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTask(index);
    });
    li.appendChild(del);

    if (task.completed) {
      completedList.appendChild(li);
    } else {
      activeList.appendChild(li);
    }
  });

  activeToggle.innerHTML = `${activeVisible ? "↑" : "↓"} Active List (${activeCount})`;
  completedToggle.innerHTML = `${completedVisible ? "↑" : "↓"} Complete List (${completedCount})`;

  activeList.classList.toggle("collapsed", !activeVisible);
  completedList.classList.toggle("collapsed", !completedVisible);
}

function toggleSection(section) {
  if (section === "active") activeVisible = !activeVisible;
  else if (section === "completed") completedVisible = !completedVisible;
  updateUI();
}

function cleanAllCompletes() {
  const newTasks = [];

  allLists[currentListName].forEach(task => {
    if (task.completed) {
      if (task.repeat !== "none") {
        const repeatedTask = {
          ...task,
          completed: false,
          completedAt: null,
          dueDate: getNextRepeatDate(task.repeat).toISOString(),
          nextRepeatDate: getNextRepeatDate(task.repeat).toISOString()
        };
        newTasks.push(repeatedTask);
      }
    } else {
      newTasks.push(task);
    }
  });

  allLists[currentListName] = newTasks;
  saveData();
  updateUI();
}

function createNewList() {
  const nameInput = document.getElementById("new-list-name");
  const name = nameInput.value.trim();

  if (!name) {
    alert("You must write a list name.");
    return;
  }

  if (allLists[name]) {
    alert("List already exists!");
    return;
  }

  allLists[name] = [];
  currentListName = name;
  nameInput.value = "";
  saveData();
  updateListSelector();
  updateUI();
}

function switchList(name) {
  currentListName = name;
  saveData();
  updateUI();
}

function deleteCurrentList() {
  if (currentListName === "Default") {
    alert("You cannot delete the Default list.");
    return;
  }

  const confirmDelete = confirm(`Are you sure you want to delete the "${currentListName}" list and all its tasks?`);
  if (!confirmDelete) return;

  delete allLists[currentListName];

  const remainingLists = Object.keys(allLists);
  currentListName = remainingLists.length ? remainingLists[0] : "Default";

  if (!allLists[currentListName]) {
    allLists[currentListName] = [];
  }

  saveData();
  updateListSelector();
  updateUI();
}

function updateListSelector() {
  const selector = document.getElementById("list-selector");
  selector.innerHTML = "";

  Object.keys(allLists).forEach(listName => {
    const option = document.createElement("option");
    option.value = listName;
    option.textContent = listName;
    if (listName === currentListName) option.selected = true;
    selector.appendChild(option);
  });
}

if (savedDarkMode) {
  document.body.classList.add("dark-mode");
  darkModeToggle.textContent = "☀️ Light Mode";
} else {
  darkModeToggle.textContent = "🌙 Dark Mode";
}

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  const enabled = document.body.classList.contains("dark-mode");

  if (enabled) {
    darkModeToggle.textContent = "☀️ Light Mode";
    localStorage.setItem("darkMode", "enabled");
  } else {
    darkModeToggle.textContent = "🌙 Dark Mode";
    localStorage.setItem("darkMode", "disabled");
  }
});

updateListSelector();
updateUI();