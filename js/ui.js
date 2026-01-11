/**
 * Render the entire app with initial data
 * @param {object} data - { question, reflection, streak, date }
 */
function renderApp(data) {
  // Render question
  renderQuestion(data.question, data.date);

  // Render reflection
  renderReflection(data.reflection);

  // Render streak
  updateStreakDisplay(data.streak);
}

/**
 * Render today's question
 * @param {object} question - Question object
 * @param {string} date - Today's date
 */
function renderQuestion(question, date) {
  const questionText = document.getElementById("question-text");
  const questionDate = document.getElementById("question-date");

  if (questionText && question) {
    questionText.textContent = question.text;
  }

  if (questionDate) {
    questionDate.textContent = formatDateForDisplay(date);
    questionDate.setAttribute("datetime", date);
  }
}

/**
 * Render reflection text in textarea
 * @param {string} text - Reflection text
 */
function renderReflection(text) {
  const textarea = document.getElementById("reflection-input");
  if (textarea) {
    textarea.value = text;
  }
}

/**
 * Update streak display
 * @param {object} streak - { current, longest }
 */
function updateStreakDisplay(streak) {
  const currentStreakEl = document.getElementById("current-streak");
  const longestStreakEl = document.getElementById("longest-streak-value");

  if (currentStreakEl) {
    currentStreakEl.textContent = streak.current;
  }

  if (longestStreakEl) {
    longestStreakEl.textContent = streak.longest;
  }
}

/**
 * Show save status indicator
 * @param {string} status - 'saving', 'saved', or 'idle'
 */
function showSaveStatus(status) {
  const saveMessage = document.getElementById("save-message");
  if (!saveMessage) return;

  switch (status) {
    case "saving":
      saveMessage.textContent = "Saving...";
      saveMessage.style.opacity = "0.6";
      break;
    case "saved":
      saveMessage.textContent = "Saved";
      saveMessage.style.opacity = "1";
      break;
    case "idle":
      saveMessage.textContent = "";
      saveMessage.style.opacity = "0";
      break;
  }
}

/**
 * Show history panel with past reflections
 * @param {Array} reflections - Array of reflection objects
 */
function showHistoryPanel(reflections) {
  const panel = document.getElementById("history-panel");
  const historyList = document.getElementById("history-list");

  if (!panel || !historyList) return;

  // Clear existing content
  historyList.innerHTML = "";

  // If no reflections, show message
  if (reflections.length === 0) {
    historyList.innerHTML =
      "<p>No past reflections yet. Start writing today!</p>";
    panel.removeAttribute("hidden");
    return;
  }

  // Render each reflection
  reflections.forEach((reflection) => {
    const item = createHistoryItem(reflection);
    historyList.appendChild(item);
  });

  // Show panel
  panel.removeAttribute("hidden");
}

/**
 * Create a history item element
 * @param {object} reflection - Reflection data
 * @returns {HTMLElement}
 */
function createHistoryItem(reflection) {
  const item = document.createElement("article");
  item.className = "history-item";

  const date = document.createElement("time");
  date.textContent = formatDateForDisplay(reflection.date);
  date.setAttribute("datetime", reflection.date);

  const question = document.createElement("h3");
  question.textContent = reflection.questionText;

  const text = document.createElement("p");
  text.textContent = reflection.reflectionText;

  item.appendChild(date);
  item.appendChild(question);
  item.appendChild(text);

  return item;
}

/**
 * Hide history panel
 */
function hideHistoryPanel() {
  const panel = document.getElementById("history-panel");
  if (panel) {
    panel.setAttribute("hidden", "");
  }
}

/**
 * Format date for human-readable display
 * @param {string} dateString - YYYY-MM-DD
 * @returns {string} Formatted date
 */
function formatDateForDisplay(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const today = new Date(getTodayDate() + "T00:00:00");

  // Check if it's today
  if (dateString === getTodayDate()) {
    return "Today";
  }

  // Check if it's yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split("T")[0];

  if (dateString === yesterdayString) {
    return "Yesterday";
  }

  // Otherwise, show full date
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}
