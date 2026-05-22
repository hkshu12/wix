export const STORAGE_KEY_ENTERED_STUDIO = 'wix.hasEnteredStudio';

export function getHasEnteredStudio(): boolean {
  return localStorage.getItem(STORAGE_KEY_ENTERED_STUDIO) === '1';
}

export function markEnteredStudio(): void {
  localStorage.setItem(STORAGE_KEY_ENTERED_STUDIO, '1');
}
