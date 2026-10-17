import React from 'react';

export interface SuccessAnimationProps {
  size?: number;
  message?: string;
  subMessage?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  size = 72,
  message,
  subMessage,
}) => {
  return (
    <div
      className="financial-success-burst"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6) var(--spacing-4)',
        textAlign: 'center',
      }}
    >
      <div
        className="success-svg-wrapper"
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: message ? 'var(--spacing-4)' : 0,
        }}
      >
        {/* Expanding subtle ripple rings */}
        <div className="success-ripple-ring ring-1" />
        <div className="success-ripple-ring ring-2" />

        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="success-checkmark-svg"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="36"
            className="success-circle-bg"
          />
          {/* Animated outline stroke */}
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="var(--color-success, #10B981)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="success-circle-stroke"
          />
          {/* Animated checkmark path */}
          <path
            d="M24 40.5L34.5 51L56 29"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="success-check-path"
          />
        </svg>
      </div>

      {message && (
        <h3
          className="success-burst-title"
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 var(--spacing-1) 0',
            letterSpacing: '-0.02em',
          }}
        >
          {message}
        </h3>
      )}

      {subMessage && (
        <p
          className="success-burst-sub"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
            maxWidth: '380px',
            lineHeight: 1.5,
          }}
        >
          {subMessage}
        </p>
      )}
    </div>
  );
};
