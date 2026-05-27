import { useCallback, useState } from 'react';

/** Updates an aria-live region; clears first so repeated messages re-announce. */
export function usePlaybackAnnouncer() {
  const [message, setMessage] = useState('');

  const announce = useCallback((text: string) => {
    setMessage('');
    requestAnimationFrame(() => {
      setMessage(text);
    });
  }, []);

  return { message, announce };
}
