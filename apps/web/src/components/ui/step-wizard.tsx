'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardStep {
  id: string;
  label: string;
}

interface StepWizardProps {
  steps: WizardStep[];
  /** 0-indexed index of the active step */
  currentStep: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Generic horizontal step-progress indicator.
 * Import and use in any multi-step form or wizard flow across the app.
 *
 * @example
 * const STEPS: WizardStep[] = [
 *   { id: 'details', label: 'Details' },
 *   { id: 'review',  label: 'Review'  },
 * ];
 * <StepWizard steps={STEPS} currentStep={0} />
 */
export function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      {steps.map((step, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        const last   = i === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            {/* Circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: done || active ? '#2e6644' : '#e6e8eb',
                  color: done || active ? '#fff' : '#8a929b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  transition: 'background 0.2s',
                }}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check size={12} strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10, whiteSpace: 'nowrap',
                  fontWeight: active ? 700 : 400,
                  color: active ? '#2e6644' : done ? '#2e6644' : '#8a929b',
                  transition: 'color 0.2s',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!last && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginTop: 12,
                  marginBottom: 18,
                  minWidth: 8,
                  background: done ? '#2e6644' : '#e6e8eb',
                  transition: 'background 0.2s',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
