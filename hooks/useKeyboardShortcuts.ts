'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  /** If true, only fires when no input is focused */
  requireNoFocus?: boolean;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({
  onCommandPalette,
  onToggleCart,
}: {
  onCommandPalette: () => void;
  onToggleCart: () => void;
}) {
  const router = useRouter();
  const pendingKey = useRef<string | null>(null);
  const pendingTimer = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl+K -> Command Palette (works even in inputs)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCommandPalette();
        return;
      }

      // Remaining shortcuts only work when not typing in inputs
      if (isInputFocused()) return;

      // / -> Focus search (on pages with search)
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"], input[placeholder*="search"]'
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          return;
        }
      }

      // C -> Toggle cart
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        onToggleCart();
        return;
      }

      // Two-key sequence: G then <key>
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        pendingKey.current = 'g';
        if (pendingTimer.current) clearTimeout(pendingTimer.current);
        pendingTimer.current = setTimeout(() => {
          pendingKey.current = null;
        }, 800);
        return;
      }

      if (pendingKey.current === 'g') {
        pendingKey.current = null;
        if (pendingTimer.current) clearTimeout(pendingTimer.current);

        switch (e.key) {
          case 'd':
            e.preventDefault();
            router.push('/dashboard');
            break;
          case 'a':
            e.preventDefault();
            router.push('/dashboard/apps');
            break;
          case 'u':
            e.preventDefault();
            router.push('/dashboard/uploads');
            break;
          case 'i':
            e.preventDefault();
            router.push('/dashboard/inventory');
            break;
          case 's':
            e.preventDefault();
            router.push('/dashboard/settings');
            break;
          case 'r':
            e.preventDefault();
            router.push('/dashboard/reports');
            break;
        }
      }
    },
    [onCommandPalette, onToggleCart, router]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [handleKeyDown]);
}

export const SHORTCUT_HINTS = [
  { keys: ['Cmd', 'K'], description: 'Command palette' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['C'], description: 'Toggle cart' },
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'A'], description: 'Go to App Catalog' },
  { keys: ['G', 'U'], description: 'Go to Deployments' },
  { keys: ['G', 'I'], description: 'Go to Inventory' },
  { keys: ['G', 'S'], description: 'Go to Settings' },
  { keys: ['G', 'R'], description: 'Go to Reports' },
] as const;
