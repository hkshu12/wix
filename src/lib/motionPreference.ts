const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Whether the user prefers reduced UI motion (system accessibility setting). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export { REDUCED_MOTION_QUERY };
