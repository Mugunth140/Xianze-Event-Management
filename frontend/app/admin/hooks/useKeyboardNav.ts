'use client';

import { useCallback, useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
}

interface UseKeyboardNavOptions {
  shortcuts?: KeyboardShortcut[];
  enabled?: boolean;
}

export default function useKeyboardNav({
  shortcuts = [],
  enabled = true,
}: UseKeyboardNavOptions = {}) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // But allow Escape key to work
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts preset for modals
export function useModalKeyboard(isOpen: boolean, onClose: () => void) {
  useKeyboardNav({
    shortcuts: [{ key: 'Escape', handler: onClose }],
    enabled: isOpen,
  });
}

// Common shortcuts preset for tables
export function useTableKeyboard(
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  itemCount: number,
  onEnter?: () => void
) {
  useKeyboardNav({
    shortcuts: [
      {
        key: 'ArrowUp',
        handler: () => setSelectedIndex(Math.max(0, selectedIndex - 1)),
      },
      {
        key: 'ArrowDown',
        handler: () => setSelectedIndex(Math.min(itemCount - 1, selectedIndex + 1)),
      },
      ...(onEnter ? [{ key: 'Enter', handler: onEnter }] : []),
    ],
    enabled: itemCount > 0,
  });
}
