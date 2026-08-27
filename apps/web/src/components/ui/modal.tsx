'use client';

import * as React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: '400px',
  md: '560px',
  lg: '720px',
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ background: 'rgba(20,24,28,0.45)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn('relative bg-white shadow-xl flex flex-col', className)}
        style={{
          borderRadius: '12px',
          width: SIZES[size],
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          zIndex: 51,
        }}
      >
        {/* Header */}
        {(title || description) && (
          <div
            className="flex-shrink-0 flex items-start justify-between gap-4"
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e6e8eb',
            }}
          >
            <div>
              {title && (
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#14181c', margin: 0 }}>
                  {title}
                </h2>
              )}
              {description && (
                <p style={{ fontSize: '13px', color: '#6b7480', marginTop: '4px' }}>
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 flex items-center justify-center rounded-md text-[#6b7480] hover:bg-[#f2f4f6] hover:text-[#14181c] transition-colors"
              style={{ width: '28px', height: '28px' }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Close button when no header */}
        {!title && !description && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex items-center justify-center rounded-md text-[#6b7480] hover:bg-[#f2f4f6] hover:text-[#14181c] transition-colors z-10"
            style={{ width: '28px', height: '28px' }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}

        {/* Body */}
        <div
          className="overflow-y-auto"
          style={{
            padding: '20px 24px',
            maxHeight: 'calc(90vh - 130px)',
            flex: '1 1 auto',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex-shrink-0 flex items-center justify-end gap-2"
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #e6e8eb',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(modal, document.body);
}

export { Modal };
