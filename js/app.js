/**
 * Application Layer
 * Contains business logic and orchestrates state + UI
 * Does NOT manipulate DOM directly (that's ui.js responsibility)
 */

// Application state (loaded on init)
let appState = null;

// Auto-save timer
let autoSaveTimer = null;
const AUTO_SAVE_DELAY = 1000; // 1 second after user stops typing

/**
 * Initialize the application
 * Called when DOM is ready
 */
function initApp() {
  // Initialize theme FIRST (before rendering UI)
  initTheme();

  // Load saved state
  appState = loadState();

  // Store the previous question ID before updating
  const previousQuestionId = appState.currentQuestionId;

  // Check if we need a new question today
  appState = updateQuestionIfNeeded(appState);

  // Detect if question rotated (new day)
  const isNewDay = previousQuestionId !== appState.currentQuestionId;

  // Calculate current streak (in case it wasn't updated)
  appState.streak = calculateStreak(appState);
  saveState(appState);

  // Get today's question
  const question = getQuestionById(appState.currentQuestionId);

  // Get today's reflection (empty string for new day)
  const reflectionText = getTodayReflection(appState);

  // Initialize UI with current data
  renderApp({
    question: question,
    reflection: reflectionText,
    streak: appState.streak,
    date: getTodayDate(),
  });

  // Initialize statistics display
  updateStatsDisplay();

  // Set up event listeners
  setupEventListeners();

  // Log for debugging
  if (isNewDay) {
    console.log("New day detected - question rotated");
  }
  console.log("App initialized:", appState);
}

/**
 * Set up event listeners for user interactions
 */
function setupEventListeners() {
  // Reflection textarea - auto-save on input
  const textarea = document.getElementById("reflection-input");
  if (textarea) {
    textarea.addEventListener("input", handleReflectionInput);
  }

  // History toggle button
  const historyToggle = document.getElementById("history-toggle");
  if (historyToggle) {
    historyToggle.addEventListener("click", handleHistoryToggle);
  }

  // History close button
  const historyClose = document.getElementById("history-close");
  if (historyClose) {
    historyClose.addEventListener("click", handleHistoryClose);
  }

  // Export data button
  const exportBtn = document.getElementById("export-data");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExportData);
  }

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
}

// Import data input
const importInput = document.getElementById("import-data-input");
if (importInput) {
  importInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      handleImportData(file);
    }
  });
}

// Clear data button
const clearBtn = document.getElementById("clear-data");
if (clearBtn) {
  clearBtn.addEventListener("click", handleClearData);
}

/**
 * Handle reflection textarea input
 * Debounced auto-save: waits for user to stop typing
 * @param {Event} event - Input event
 */
function handleReflectionInput(event) {
  const text = event.target.value;

  // Update live word count immediately
  updateLiveWordCount(text);

  // Clear existing timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  // Show "saving..." indicator immediately
  showSaveStatus("saving");

  // Set new timer to save after user stops typing
  autoSaveTimer = setTimeout(() => {
    saveReflection(text);
  }, AUTO_SAVE_DELAY);
}

/**
 * Save the reflection to state
 * @param {string} text - Reflection text
 */
function saveReflection(text) {
  // Save to state and get updated state back
  appState = saveTodayReflection(appState, text);

  // Update UI with new streak (if changed)
  updateStreakDisplay(appState.streak);

  // Update all statistics
  updateStatsDisplay();

  // Show "saved" indicator
  showSaveStatus("saved");

  // Clear "saved" message after 2 seconds
  setTimeout(() => {
    showSaveStatus("idle");
  }, 2000);
}

/**
 * Handle history panel toggle
 */
function handleHistoryToggle() {
  // Get all reflections from state
  const reflections = getAllReflections(appState);

  // Show history panel with reflections
  showHistoryPanel(reflections);
}

/**
 * Handle history panel close
 */
function handleHistoryClose() {
  hideHistoryPanel();
}

/**
 * Handle data export
 * Downloads reflections as JSON file
 */
function handleExportData() {
  const jsonData = exportData();
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // Create temporary download link
  const link = document.createElement("a");
  link.href = url;
  link.download = `reflections-${getTodayDate()}.json`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showNotification("Data exported successfully!");
}

/**
 * Handle data import
 * @param {File} file - JSON file to import
 */
function handleImportData(file) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const jsonString = event.target.result;
    const success = importData(jsonString);

    if (success) {
      showNotification("Data imported successfully!");
      // Reload the app with new data
      location.reload();
    } else {
      showNotification("Import failed. Please check the file format.", "error");
    }
  };

  reader.onerror = function () {
    showNotification("Error reading file.", "error");
  };

  reader.readAsText(file);
}

/**
 * Handle clear data request
 * Shows confirmation before clearing
 */
function handleClearData() {
  const confirmed = confirm(
    "Are you sure you want to delete all your reflections? This cannot be undone.\n\n" +
      "Consider exporting your data first.",
  );

  if (confirmed) {
    const success = clearAllData();
    if (success) {
      showNotification("All data cleared.");
      location.reload();
    } else {
      showNotification("Error clearing data.", "error");
    }
  }
}

/**
 * Get all reflections with their questions
 * Returns array sorted by date (most recent first)
 * @param {object} state - Application state
 * @returns {Array} Array of reflection objects
 */
function getAllReflections(state) {
  const reflections = [];

  // Convert reflections object to array
  for (const date in state.reflections) {
    const reflection = state.reflections[date];

    // Only include reflections with text
    if (reflection.text && reflection.text.trim().length > 0) {
      const question = getQuestionById(reflection.questionId);

      reflections.push({
        date: date,
        questionText: question ? question.text : "Question not found",
        reflectionText: reflection.text,
        lastEdited: reflection.lastEdited,
      });
    }
  }

  // Sort by date, most recent first
  reflections.sort((a, b) => b.date.localeCompare(a.date));

  return reflections;
}

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "January 10, 2026")
 */
function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00"); // Add time to prevent timezone issues
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Check if date is today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
function isToday(dateString) {
  return dateString === getTodayDate();
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  // DOM already loaded
  initApp();
}

/**
 * Initialize theme
 * Checks saved preference, falls back to system preference
 */
function initTheme() {
  const savedTheme = getSavedTheme();
  const theme = savedTheme || getSystemTheme();
  applyTheme(theme);

  // Listen for system theme changes
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem("theme")) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
  }
}

/**
 * Apply theme to document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

/**
 * Update theme toggle icon
 * @param {string} theme - Current theme
 */
function updateThemeIcon(theme) {
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  applyTheme(newTheme);
  saveTheme(newTheme);
}
/**
 * Update statistics display
 * Called on init and after saving reflection
 */
function updateStatsDisplay() {
  const stats = calculateStats(appState);
  const streakStats = getStreakStats(appState);

  // Update current word count (always visible)
  updateCurrentWordCount(stats.currentWords);

  // Update detailed stats
  updateDetailedStats(stats, streakStats);
}

/**
 * Update current word count (in collapsed summary)
 * @param {number} wordCount - Current word count
 */
function updateCurrentWordCount(wordCount) {
  const currentWordCountEl = document.getElementById("current-word-count");
  if (currentWordCountEl) {
    const plural = wordCount === 1 ? "word" : "words";
    currentWordCountEl.textContent = `${wordCount} ${plural}`;
  }
}

/**
 * Update detailed statistics
 * @param {object} stats - Statistics object
 * @param {object} streakStats - Streak statistics object
 */
function updateDetailedStats(stats, streakStats) {
  // Current words
  const statCurrent = document.getElementById("stat-current-words");
  if (statCurrent) {
    statCurrent.textContent = formatNumber(stats.currentWords);
  }

  // Average words
  const statAverage = document.getElementById("stat-average-words");
  if (statAverage) {
    statAverage.textContent = formatNumber(stats.averageWords);
  }

  // Total words
  const statTotal = document.getElementById("stat-total-words");
  if (statTotal) {
    statTotal.textContent = formatNumber(stats.totalWords);
  }

  // Total reflections
  const statReflections = document.getElementById("stat-total-reflections");
  if (statReflections) {
    statReflections.textContent = formatNumber(stats.totalReflections);
  }

  // Longest reflection
  const statLongest = document.getElementById("stat-longest");
  if (statLongest) {
    statLongest.textContent = formatNumber(stats.longestReflection);
  }

  // Days writing
  const statDays = document.getElementById("stat-days-writing");
  if (statDays) {
    statDays.textContent = formatNumber(streakStats.totalDays);
  }

  // Contextual message
  updateStatsContext(stats, streakStats);
}

/**
 * Update contextual stats message
 * Provides encouraging, personalized feedback
 * @param {object} stats - Statistics object
 * @param {object} streakStats - Streak statistics object
 */
function updateStatsContext(stats, streakStats) {
  const contextEl = document.getElementById("stats-context");
  if (!contextEl) return;

  let message = "";

  if (stats.totalReflections === 0) {
    message = "Start your first reflection to see your writing statistics.";
  } else if (stats.totalReflections === 1) {
    message =
      "Your reflection journey has begun! Keep writing to build your practice.";
  } else if (stats.currentWords > stats.averageWords) {
    const diff = stats.currentWords - stats.averageWords;
    message = `Today's reflection is ${diff} words longer than your average. You're diving deep!`;
  } else if (
    stats.currentWords > 0 &&
    stats.currentWords < stats.averageWords
  ) {
    message = "Sometimes brevity is powerful. Every reflection counts.";
  } else if (streakStats.totalDays >= 7) {
    message = `You've been reflecting for ${streakStats.totalDays} days. That's ${formatNumber(stats.totalWords)} words of self-discovery.`;
  } else {
    message = `You've written ${formatNumber(stats.totalWords)} words across ${stats.totalReflections} reflections.`;
  }

  contextEl.textContent = message;
}

/**
 * Update word count in real-time as user types
 * Called from handleReflectionInput
 * @param {string} text - Current textarea text
 */
function updateLiveWordCount(text) {
  const wordCount = countWords(text);
  updateCurrentWordCount(wordCount);

  // Also update the detailed current words stat if stats panel is open
  const statCurrent = document.getElementById("stat-current-words");
  if (statCurrent) {
    statCurrent.textContent = formatNumber(wordCount);
  }
}
