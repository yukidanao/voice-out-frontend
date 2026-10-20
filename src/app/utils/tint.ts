/**
 * Shared accent hues for "randomly" colored cards.
 *
 * Hues are hand-picked rather than fully random so every tint stays legible
 * on the dark surface, and the seed is hashed so a card keeps the same color
 * across re-renders, reloads and server-side prerendering.
 */
export const TINTS = [8, 28, 44, 92, 142, 168, 194, 214, 248, 276, 302, 330];

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function tintFor(seed: string): number {
  return TINTS[hashString(seed) % TINTS.length];
}
