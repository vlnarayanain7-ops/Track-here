export const STUDY_CATEGORIES = [];

export const DEFAULT_STUDY_CATEGORIES = [];

export const PREPARATION_TYPES = [
  { value: 'JEE', label: 'JEE (Engineering)', defaultSubjects: ['Physics', 'Chemistry', 'Mathematics'] },
  { value: 'NEET', label: 'NEET (Medical)', defaultSubjects: ['Physics', 'Chemistry', 'Botany', 'Zoology'] },
  { value: 'UPSC', label: 'UPSC (Civil Services)', defaultSubjects: ['General Studies', 'CSAT', 'Optional Subject'] },
  { value: 'GATE', label: 'GATE (Graduate)', defaultSubjects: ['Engineering Mathematics', 'Core Subject', 'General Aptitude'] },
  { value: 'University', label: 'University/College', defaultSubjects: [] },
  { value: 'Competitive Programming', label: 'Competitive Programming', defaultSubjects: ['C++', 'DSA', 'Competitive Programming'] },
  { value: 'Placement', label: 'Placement Preparation', defaultSubjects: ['DSA', 'System Design', 'Core CS', 'Aptitude'] },
  { value: 'Custom', label: 'Custom Learning', defaultSubjects: [] },
];

export const SUBJECT_COLOR_KEYS = [
  'blue',
  'green',
  'amber',
  'rose',
  'violet',
  'cyan',
  'orange',
  'slate',
];

export const SUBJECT_COLORS = [
  '#1D4ED8', // blue
  '#15803D', // green
  '#A15207', // amber
  '#BE185D', // rose
  '#6D28D9', // violet
  '#0E7490', // cyan
  '#C2410C', // orange
  '#475569', // slate
];

export const SUBJECT_ICONS = [
  'BookOpen', 'Beaker', 'Calculator', 'Globe', 'Code', 'Brain',
  'Microscope', 'Atom', 'FileText', 'Lightbulb', 'Target', 'Compass',
];

export const ACTIVITY_TYPES = [
  'Video/Tutorial',
  'Reading',
  'Coding',
  'Problem Solving',
  'Revision',
  'Practice',
];

export const PROBLEM_PLATFORMS = [
  'Codeforces',
  'CodeChef',
  'LeetCode',
  'Other',
];

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

export const ATTEMPT_OUTCOMES = [
  'Solved independently',
  'Solved with hints',
  'Solved after viewing solution',
  'Not solved',
];

export const TASK_PRIORITIES = ['Low', 'Medium', 'High'];

export const TASK_STATUSES = ['Todo', 'In Progress', 'Completed', 'Cancelled'];

export const REVISION_FEEDBACKS = [
  { value: 'Easy', label: 'Easy (Double interval)', color: 'text-emerald-400' },
  { value: 'Correct but slow', label: 'Correct but slow (+50% interval)', color: 'text-blue-400' },
  { value: 'Needed hint', label: 'Needed hint (Keep interval)', color: 'text-amber-400' },
  { value: 'Forgot', label: 'Forgot (Reset to 1 day)', color: 'text-rose-400' },
];

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
