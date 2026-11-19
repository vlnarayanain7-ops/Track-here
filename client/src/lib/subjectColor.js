const legacy = ['blue', 'green', 'amber', 'rose', 'violet', 'cyan', 'orange', 'slate'];
export function subjectColor(value = 'green') {
  if (value.startsWith('#') || value.startsWith('var(')) return value;
  if (value.startsWith('--')) return `var(${value})`;
  const old = /^c?([1-8])$/.exec(value);
  const name = old ? legacy[Number(old[1]) - 1] : value;
  return legacy.includes(name) ? `var(--c-${name})` : 'var(--primary)';
}
