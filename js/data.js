const Questions = [
  {
    id: 1,
    text: "What assumption about yourself are you ready to question?",
  },
  {
    id: 2,
    text: "What would you do if you knew no one would judge you?",
  },
  {
    id: 3,
    text: "What are you avoiding by staying busy?",
  },
  {
    id: 4,
    text: "When did you last change your mind about something important?",
  },
  {
    id: 5,
    text: "What would your younger self not recognize about who you are now?",
  },
  {
    id: 6,
    text: "What truth are you dancing around instead of facing directly?",
  },
  {
    id: 7,
    text: "If your life were a book, what chapter are you avoiding writing?",
  },
  {
    id: 8,
    text: "What permission are you waiting for that you could give yourself?",
  },
  {
    id: 9,
    text: "What would you do differently if you loved yourself unconditionally?",
  },
  {
    id: 10,
    text: "What are you pretending not to know?",
  },
  {
    id: 11,
    text: "What was the best part of your day?",
  },
  {
    id: 12,
    text: "What made you smile today?",
  },
  {
    id: 13,
    text: "What made you feel accomplished today?",
  },
];

function getQuestionById(id) {
  return Questions.find((q) => q.id === id) || null;
}

function getNextQuestionId(currentId) {
  // If current is the last question, wrap to 1
  if (currentId >= Questions.length) {
    return 1;
  }
  return currentId + 1;
}
function getTotalQuestions() {
  return Questions.length;
}
