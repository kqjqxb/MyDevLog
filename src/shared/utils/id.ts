/**
 * Generates a reasonably-unique id without pulling in a uuid dependency.
 * Sufficient for client-side, single-user task ids.
 */
export function createId(prefix = 'id'): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${random}`;
}
