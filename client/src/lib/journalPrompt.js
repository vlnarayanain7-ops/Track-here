// src/lib/journalPrompt.js: which journal button Today shows
export function journalPrompt({ now = new Date(), hasPlan = false, hasReview = false } = {}) {
  const h = now.getHours();
  if (h < 12 && !hasPlan) return 'morning';
  if (h >= 18 && !hasReview) return 'evening';
  return null; // null: show a quiet "Journal" button that opens the sheet with a Morning / Evening switch
}
