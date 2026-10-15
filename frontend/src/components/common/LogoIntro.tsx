/**
 * FINServ Logo Intro Animation
 * Rule: "Short logo intro once per session. Respect prefers-reduced-motion.
 * Guarded by sessionStorage."
 */

import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const INTRO_STORAGE_KEY = 'finserv_logo_intro_seen';
const INTRO_DURATION_MS = 1400;

export interface LogoIntroProps {
  onComplete?: () => void;
}

export const LogoIntro: React.FC<LogoIntroProps> = ({ onComplete }) => {
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => {
    // If reduced motion is requested or already shown this session, don't show
    if (typeof window === 'undefined') return false;
    const seen = sessionStorage.getItem(INTRO_STORAGE_KEY);
    return !seen && !prefersReduced;
  });
  const [fadingOut, setFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (!visible) return;

    // Trigger fade-out shortly before removal
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, INTRO_DURATION_MS - 300);

    const completeTimer = setTimeout(() => {
      sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
      setVisible(false);
      onComplete?.();
    }, INTRO_DURATION_MS);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
        setVisible(false);
        onComplete?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="FINServ Banking Management System"
      data-testid="logo-intro"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--surface-bg, #0B192C)',
        transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: fadingOut ? 0 : 1,
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
      onClick={() => {
        sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
        setVisible(false);
        onComplete?.();
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-4)',
          transform: fadingOut ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <BrandLogo size="lg" showSubtitle={true} />
        <div
          style={{
            width: '120px',
            height: '2px',
            backgroundColor: 'var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: '1px',
            overflow: 'hidden',
            marginTop: 'var(--spacing-2)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--brand-accent, #2EC4B6)',
              animation: 'logoIntroProgress 1.1s cubic-bezier(0.65, 0, 0.35, 1) forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
};
