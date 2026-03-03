import { useEffect } from 'react';

const BASE_TITLE = 'GameHub';

/**
 * Sets document.title on mount and restores it on unmount.
 * @param {string} title - Page-specific title segment
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
    return () => { document.title = prev; };
  }, [title]);
}
