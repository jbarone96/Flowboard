/**
 * Converts a workspace name into a URL-safe slug, with a short random
 * suffix appended to guarantee uniqueness against the database's unique
 * constraint without a round-trip check-then-insert race (same principle
 * as SlotSync's booking-slot constraint, lower stakes here since a
 * slug collision only affects a URL, not double-booked data).
 */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}