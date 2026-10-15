/**
 * FINServ Frontend Home Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HealthWidget } from '@/features/health/HealthWidget';
import { ShieldCheck, Palette, ArrowRight, CheckCircle2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--spacing-10) var(--spacing-4)' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-4)' }}>
          <Badge variant="brand" withDot>
            Phase 2: Frontend Foundation & Design System
          </Badge>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 'var(--spacing-3)',
          }}
        >
          FINServ Banking System
        </h1>

        <p
          style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--text-secondary)',
            maxWidth: 680,
            margin: '0 auto var(--spacing-6)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          High-integrity enterprise core banking management platform built with Spring Boot 3.3,
          React 19, strict token-driven CSS architecture, and balanced double-entry accounting.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <Link to="/app" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
              Open Core Banking Shell
            </Button>
          </Link>

          {import.meta.env.DEV && (
            <Link to="/design-system" style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="lg" leftIcon={<Palette size={18} />}>
                Living Design System
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid of Features & Health */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--spacing-6)',
          marginBottom: 'var(--spacing-12)',
        }}
      >
        <Card variant="elevated">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <ShieldCheck size={20} color="var(--brand-primary)" />
              <CardTitle>Financial Safety Engineering</CardTitle>
            </div>
            <CardDescription>
              Backend-enforced invariants and strict zero-floating-point policy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Zero IEEE 754 floating point (Decimal.js + BigDecimal)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Strict idempotency keys on all state mutations
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                SHA-256 canonical audit chain & immutable database triggers
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Phase 1 Backend frozen & 52 automated tests verified
            </span>
          </CardFooter>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <Palette size={20} color="var(--brand-primary)" />
              <CardTitle>Token-Driven Design System</CardTitle>
            </div>
            <CardDescription>
              Layered CSS variable tokens with accessible WCAG AA primitives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Accessible Radix headless primitives (Dialog, Tabs, Select)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Keyboard focus-visible, reduced-motion, and a11y compliance
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Brand-swap readiness for Phase 3 asset ingestion
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link to="/design-system" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                Explore Components
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <div>
          <HealthWidget />
        </div>
      </div>
    </div>
  );
};
