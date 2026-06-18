import { useEffect, useState } from 'react';

import { relativeTime } from '@/shared/utils/date';

function getLabel(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 60_000) return 'just now';
    return relativeTime(iso);
  } catch {
    return '';
  }
}

/** Returns a live-updating relative time label ("just now", "5 minutes ago", etc.).
 *  Re-renders only the calling component — no parent or sibling re-renders. */
export function useRelativeTime(iso: string): string {
  const [label, setLabel] = useState(() => getLabel(iso));

  useEffect(() => {
    setLabel(getLabel(iso));

    let timer: ReturnType<typeof setTimeout>;

    function schedule(): void {
      const diffMs = Date.now() - new Date(iso).getTime();
      // Adaptive delay: 30s while "just now", 60s for minutes, 5 min for hours+
      const delay = diffMs < 60_000 ? 30_000 : diffMs < 3_600_000 ? 60_000 : 300_000;
      timer = setTimeout(() => {
        setLabel(getLabel(iso));
        schedule();
      }, delay);
    }

    schedule();
    return () => clearTimeout(timer);
  }, [iso]);

  return label;
}
