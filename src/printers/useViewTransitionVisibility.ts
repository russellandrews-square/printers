import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/**
 * Mirrors `open` into local `shown` using `document.startViewTransition` only when the
 * value changes. Avoids the issue where `MarketModal.useTransitionState` always wraps
 * updates in a transition—even no-ops—which can cancel a parent modal’s transition
 * when nested pickers mount in the same frame.
 */
export function useViewTransitionVisibility(open: boolean): boolean {
  const [shown, setShown] = useState(open);

  useLayoutEffect(() => {
    if (open === shown) {
      return;
    }
    const doc = typeof document !== 'undefined' ? document : undefined;
    if (doc && 'startViewTransition' in doc && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        flushSync(() => setShown(open));
      });
    } else {
      setShown(open);
    }
  }, [open, shown]);

  return shown;
}
