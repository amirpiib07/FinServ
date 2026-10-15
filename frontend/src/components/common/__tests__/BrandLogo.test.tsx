import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrandLogo } from '../BrandLogo';
import { LogoIntro } from '../LogoIntro';

describe('BrandLogo Component', () => {
  it('renders full brand logo with Core Banking subtitle by default', () => {
    render(<BrandLogo size="md" />);
    expect(screen.getByTestId('brand-logo')).toBeInTheDocument();
    expect(screen.getByAltText('FINServ')).toBeInTheDocument();
    expect(screen.getByText('Core Banking')).toBeInTheDocument();
  });

  it('renders mark variant with finserv-mark.svg', () => {
    render(<BrandLogo variant="mark" size="sm" />);
    expect(screen.getByTestId('brand-logo-mark')).toBeInTheDocument();
    expect(screen.getByAltText('FINServ Mark')).toBeInTheDocument();
    expect(screen.queryByText('Core Banking')).not.toBeInTheDocument();
  });

  it('can hide subtitle when showSubtitle=false', () => {
    render(<BrandLogo showSubtitle={false} />);
    expect(screen.queryByText('Core Banking')).not.toBeInTheDocument();
  });
});

describe('LogoIntro Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders on first session when sessionStorage is empty', () => {
    render(<LogoIntro />);
    expect(screen.getByTestId('logo-intro')).toBeInTheDocument();
  });

  it('dismisses immediately on Escape key and records session seen', () => {
    render(<LogoIntro />);
    expect(screen.getByTestId('logo-intro')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(sessionStorage.getItem('finserv_logo_intro_seen')).toBe('true');
  });

  it('does not render if already seen in current session', () => {
    sessionStorage.setItem('finserv_logo_intro_seen', 'true');
    render(<LogoIntro />);
    expect(screen.queryByTestId('logo-intro')).not.toBeInTheDocument();
  });
});
