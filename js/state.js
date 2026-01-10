const STORAGE_KEY = "reflectionApp";

const DEFAULT_STATE = {
  currentQuestionId: 1,
  lastQuestionDate: null,
  reflections: {},
  streak: {
    current: 0,
    longest: 0,
    lastReflectionDate: null,
  },
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Load state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return { ...DEFAULT_STATE };
    }

    const parsed = JSON.parse(saved);

    // Validate structure (basic check)
    if (!parsed.reflections || !parsed.streak) {
      console.warn("Corrupted state detected, using default");
      return { ...DEFAULT_STATE };
    }

    return parsed;
  } catch (error) {
    console.error("Error loading state:", error);
    return { ...DEFAULT_STATE };
  }
}

//  Save state to localStorage

function saveState(state) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error("Error saving state:", error);
    return false;
  }
}

// Get today's reflection text

function getTodayReflection(state) {
  const today = getTodayDate();
  const reflection = state.reflections[today];
  return reflection ? reflection.text : "";
}

// Save today's reflection
function saveTodayReflection(state, text) {
  const today = getTodayDate();

  // Create a new state object (immutability principle)
  const newState = {
    ...state,
    reflections: {
      ...state.reflections,
      [today]: {
        questionId: state.currentQuestionId,
        text: text,
        lastEdited: new Date().toISOString(),
      },
    },
  };

  // Update streak if this is a new reflection or first reflection of the day
  const hadReflectionToday =
    state.reflections[today] && state.reflections[today].text.length > 0;
  const hasReflectionNow = text.length > 0;

  // Only update streak if we went from no reflection to having one
  if (!hadReflectionToday && hasReflectionNow) {
    newState.streak = calculateStreak(newState);
  }

  saveState(newState);
  return newState;
}

//   Calculate current and longest streak

function calculateStreak(state) {
  const dates = Object.keys(state.reflections)
    .filter((date) => state.reflections[date].text.length > 0) // Only count non-empty reflections
    .sort()
    .reverse(); // Most recent first

  if (dates.length === 0) {
    return { current: 0, longest: 0, lastReflectionDate: null };
  }

  const today = getTodayDate();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Calculate current streak (must include today or yesterday)
  const latestDate = dates[0];
  const latestDateObj = new Date(latestDate);
  const todayObj = new Date(today);
  const daysSinceLatest = Math.floor(
    (todayObj - latestDateObj) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLatest <= 1) {
    // Current streak is active
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);

      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const daysDiff = Math.floor(
          (prevDate - currentDate) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 1) {
          tempStreak++;
        } else {
          break; // Streak broken
        }
      }
    }
    currentStreak = tempStreak;
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
      longestStreak = 1;
    } else {
      const currentDate = new Date(dates[i]);
      const prevDate = new Date(dates[i - 1]);
      const daysDiff = Math.floor(
        (prevDate - currentDate) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, state.streak.longest), // Never decrease longest
    lastReflectionDate: dates[0],
  };
}
// Check if we need a new question today

function updateQuestionIfNeeded(state) {
  const today = getTodayDate();

  // If lastQuestionDate is null (first use) or different from today, rotate question
  if (state.lastQuestionDate !== today) {
    const newState = {
      ...state,
      currentQuestionId: getNextQuestionId(state.currentQuestionId),
      lastQuestionDate: today,
    };

    saveState(newState);
    return newState;
  }

  return state;
}
