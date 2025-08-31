"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: string;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    previousActive.current = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', onKey);

    // prevent background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus the close button when opened
    setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      // return focus
      try {
        previousActive.current?.focus();
      } catch (_) {
        /* ignore */
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // no footer actions; long content is scrollable inside .modal-body

  const overlayCls = variant ? `modal-overlay modal-overlay--${variant}` : 'modal-overlay';
  const modalCls = variant ? `modal modal--${variant}` : 'modal';

  const modalContent = (
    <div
      className={overlayCls}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      onClick={onClose}
    >
      <div className={modalCls} onClick={(e) => e.stopPropagation()} aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <div className="modal-actions">
            <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Schließen">
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body" ref={bodyRef}>
          {children}
        </div>

        {/* footer intentionally removed; keep close button in header */}
      </div>
    </div>
  );

  // render outside app root so stacking contexts don't interfere
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
