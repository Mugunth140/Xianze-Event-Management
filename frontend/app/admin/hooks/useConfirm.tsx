'use client';

import { useCallback, useRef, useState } from 'react';
import { ConfirmModal } from '../components/ui/Modal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
}

/**
 * useConfirm – drop-in replacement for window.confirm()
 *
 * Returns:
 *  - `confirm(options)` – an async function that shows the modal and resolves
 *     to `true` (confirmed) or `false` (cancelled).
 *  - `ConfirmDialog` – a React component you render once at the bottom of
 *     your page. It shows/hides automatically.
 *
 * Usage:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const ok = await confirm({
 *     title: 'Delete item',
 *     message: 'Are you sure?',
 *     confirmText: 'Delete',
 *     confirmVariant: 'danger',
 *   });
 *   if (!ok) return;
 *   // proceed…
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export default function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setIsOpen(false);
  }, []);

  const ConfirmDialog = useCallback(
    () => (
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText ?? 'Confirm'}
        confirmVariant={options.confirmVariant ?? 'primary'}
      />
    ),
    [isOpen, options, handleClose, handleConfirm]
  );

  return { confirm, ConfirmDialog };
}
