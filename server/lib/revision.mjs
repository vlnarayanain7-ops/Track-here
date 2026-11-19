export function calculateNextInterval(currentInterval = 1, feedback) {
  switch (feedback) {
    case 'Remembered':
    case 'Easy':
      // 1 -> 3 -> 7 -> 14 -> 30
      if (currentInterval <= 1) return 3;
      if (currentInterval <= 3) return 7;
      if (currentInterval <= 7) return 14;
      if (currentInterval <= 14) return 30;
      return currentInterval * 2;
    case 'Correct but slow':
      if (currentInterval <= 1) return 2;
      return Math.round(currentInterval * 1.5);
    case 'Needed hint':
      return currentInterval;
    case 'Hard':
    case 'Forgot':
      return 1;
    default:
      return 3;
  }
}

