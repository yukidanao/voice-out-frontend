/**
 * Keeps a single piece of media playing at a time across the whole app,
 * regardless of whether it's an audio note or a video note.
 */
let activeMedia: HTMLMediaElement | null = null;

export function claimPlayback(element: HTMLMediaElement): void {
  if (activeMedia && activeMedia !== element) {
    activeMedia.pause();
  }
  activeMedia = element;
}

export function releasePlayback(element: HTMLMediaElement): void {
  if (activeMedia === element) activeMedia = null;
}
