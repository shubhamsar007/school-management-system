'use client';

import * as React from 'react';
import ReactDOM from 'react-dom';
import { Check, X, AlertCircle, Info } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error:   (message: string) => void;
  info:    (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = React.createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  function add(message: string, variant: ToastVariant) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const ctx: ToastContextValue = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
  };

  const list =
    typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <ToastList toasts={toasts} onDismiss={dismiss} />,
          document.body,
        )
      : null;

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {list}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; color: string; Icon: React.ElementType }> = {
  success: { bg: '#f0faf3', border: '#a8d5b5', color: '#1a5c35', Icon: Check        },
  error:   { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', Icon: AlertCircle  },
  info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', Icon: Info         },
};

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = React.useState(false);
  const s = VARIANT_STYLES[toast.variant];

  // Fade in
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      style={{
        pointerEvents: 'all',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 280,
        maxWidth: 380,
        padding: '12px 14px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
    >
      <s.Icon size={16} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 13, color: s.color, fontWeight: 500, lineHeight: 1.45 }}>
        {toast.message}
      </span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: s.color,
          opacity: 0.6,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
}
