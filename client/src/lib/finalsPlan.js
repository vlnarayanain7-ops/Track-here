import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';

export const dayKey = date => format(date, 'yyyy-MM-dd');
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
const validCapacity = value => Number.isInteger(value) && value >= 1 && value <= 12;

export function buildFinalsPlan(start, exam, topics, capacity) {
  const names = [...new Set(topics.split('\n').map(s => s.trim()).filter(Boolean))];
  const days = differenceInCalendarDays(parseISO(exam), parseISO(start));
  if (!validDay(start) || !validDay(exam) || days < 1 || days > 90 || !names.length || !validCapacity(capacity)) {
    throw new Error('Choose an exam within the next 90 days, at least one topic, and 1–12 blocks per day.');
  }
  const slots = days * capacity;
  const blocks = Array.from({ length: Math.max(slots, names.length) }, (_, id) => ({
    id, topic: names[id % names.length], done: false,
    date: id < slots ? dayKey(addDays(parseISO(start), Math.floor(id / capacity))) : null,
  }));
  return { exam, capacity, blocks };
}

export function reschedule(plan, resume, capacity, today) {
  if (!validDay(resume) || resume < today || resume >= plan.exam || !validCapacity(capacity)) {
    throw new Error('Choose a remaining day before the exam and 1–12 blocks per day.');
  }
  const occupied = new Map();
  for (const block of plan.blocks) {
    if (block.done) occupied.set(block.date, (occupied.get(block.date) || 0) + 1);
  }
  let next = parseISO(resume);
  const blocks = plan.blocks.map(block => {
    if (block.done) return block;
    let date = dayKey(next);
    while (date < plan.exam && (occupied.get(date) || 0) >= capacity) {
      next = addDays(next, 1);
      date = dayKey(next);
    }
    if (date >= plan.exam) return { ...block, date: null };
    occupied.set(date, (occupied.get(date) || 0) + 1);
    return { ...block, date };
  });
  return { ...plan, capacity, blocks };
}
