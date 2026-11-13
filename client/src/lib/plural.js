export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
// plural(1,'day') -> "1 day", plural(3,'chapter') -> "3 chapters"

