//textUtils.js

const countWords = (text) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const countCharacters = (text) => {
  return text.length;
};

const calculateProgress = (current, goal) => {
  return Math.min(Math.round((current / goal) * 100), 100);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export { countWords, countCharacters, calculateProgress, formatTime };
