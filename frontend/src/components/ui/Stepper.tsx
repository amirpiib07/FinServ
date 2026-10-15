/**
 * FINServ Stepper Component
 * Designed for the progressive registration & onboarding journey (Phase 5+)
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  className?: string;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStepIndex,
  className = '',
  onStepClick,
}) => {
  return (
    <nav className={`stepper-root ${className}`.trim()} aria-label="Progressive onboarding progress">
      <ol style={{ display: 'flex', alignItems: 'center', width: '100%', listStyle: 'none' }}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isClickable = Boolean(onStepClick && index <= currentStepIndex);

          let statusClass = 'upcoming';
          if (isCompleted) statusClass = 'completed';
          if (isActive) statusClass = 'active';

          return (
            <React.Fragment key={step.id}>
              <li
                className={`stepper-item ${statusClass}`}
                aria-current={isActive ? 'step' : undefined}
                style={isClickable ? { cursor: 'pointer' } : undefined}
                onClick={() => isClickable && onStepClick?.(index)}
              >
                <div className="stepper-indicator" aria-hidden="true">
                  {isCompleted ? <Check size={16} strokeWidth={2.5} /> : index + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="stepper-label">{step.label}</span>
                  {step.description && (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                      {step.description}
                    </span>
                  )}
                </div>
              </li>

              {index < steps.length - 1 && (
                <div
                  className={`stepper-connector ${index < currentStepIndex ? 'completed' : ''}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
