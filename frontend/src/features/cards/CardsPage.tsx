import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cardService } from './cardService';
import type { VirtualCard, UpdateCardControlsRequest } from '@/types/card';
import { formatINR } from '@/lib/money';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  CreditCard,
  Shield,
  Lock,
  Unlock,
  Globe,
  Wifi,
  ShoppingBag,
  Sliders,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const CardsPage: React.FC = () => {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [savingControls, setSavingControls] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Spend limit editing state
  const [dailyLimit, setDailyLimit] = useState<number>(0);
  const selectedCardIdRef = useRef('');
  const mountedRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await cardService.getCustomerCards();
      if (!mountedRef.current) return;
      setCards(res);
      const selectedCard =
        res.find((card) => card.id === selectedCardIdRef.current) ?? res[0];
      selectedCardIdRef.current = selectedCard?.id ?? '';
      setSelectedCardId(selectedCard?.id ?? '');
      setDailyLimit(selectedCard ? Number(selectedCard.dailySpendLimit) : 0);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Unable to load virtual cards.';
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const timeoutId = window.setTimeout(() => void loadCards(), 0);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadCards]);

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleUpdateControls = async (req: UpdateCardControlsRequest, successText: string) => {
    if (!activeCard) return;
    try {
      setError(null);
      setSavingControls(true);
      const updated = await cardService.updateCardControls(activeCard.id, req);
      if (!mountedRef.current) return;
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (updated.id === selectedCardIdRef.current) {
        setDailyLimit(Number(updated.dailySpendLimit));
      }
      showToast(successText);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to update card profile settings.';
      setError(msg);
    } finally {
      if (mountedRef.current) setSavingControls(false);
    }
  };

  const toggleFreeze = () => {
    if (!activeCard) return;
    const newStatus = activeCard.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    void handleUpdateControls(
      { status: newStatus },
      newStatus === 'FROZEN' ? 'Card profile marked frozen.' : 'Card profile marked active.'
    );
  };

  const handleSaveLimit = () => {
    if (!activeCard) return;
    if (!Number.isFinite(dailyLimit) || dailyLimit < 0) {
      setError('Profile limit must be a valid non-negative amount.');
      return;
    }
    void handleUpdateControls(
      { dailySpendLimit: dailyLimit },
      `Profile limit saved as ${formatINR(dailyLimit)}.`
    );
  };

  const isFrozen = activeCard?.status === 'FROZEN';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--spacing-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'var(--surface-primary)',
            color: 'var(--text-primary)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Sparkles size={16} color="var(--brand-primary)" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-8)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
            <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Virtual Card Profiles
            </h1>
            <Badge variant="neutral">Profile preview</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
            Review persisted card-profile settings. No external payment processor is connected to apply them.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Button variant="outline" size="sm" onClick={() => void loadCards()} isLoading={loading} disabled={loading}>
            <RefreshCw size={14} style={{ marginRight: '6px' }} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--danger-subtle)',
            color: 'var(--danger)',
            padding: 'var(--spacing-4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-6)',
            border: '1px solid var(--danger-border)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-12)' }}>
          <Spinner size={32} />
        </div>
      ) : cards.length === 0 || !activeCard ? (
        <EmptyState
          title="No card profiles available"
          description="Card profiles are associated with eligible active accounts. Complete account setup or contact support if you expected a profile."
        />
      ) : (
        <div>
          {/* Card Selector Pills if multiple */}
          {cards.length > 1 && (
            <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)', overflowX: 'auto', paddingBottom: '4px' }}>
              {cards.map((card) => {
                const isSelected = card.id === activeCard?.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      selectedCardIdRef.current = card.id;
                      setSelectedCardId(card.id);
                      setDailyLimit(Number(card.dailySpendLimit));
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--brand-surface)' : 'var(--surface-primary)',
                      color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Account ending in {card.accountNumber.slice(-4)}</span>
                    <Badge variant={card.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {card.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Grid: Card Graphic on Left, Controls on Right */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
              gap: 'var(--spacing-8)',
              alignItems: 'start',
            }}
          >
            {/* Card Graphic Column */}
            <div>
              {/* 3D Metallic Debit Card Canvas */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '440px',
                  aspectRatio: '1.586',
                  borderRadius: '20px',
                  background: isFrozen
                    ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
                    : 'linear-gradient(135deg, #0A192F 0%, #0F2D3C 45%, #0B3C49 80%, #164E63 100%)',
                  padding: '24px 28px',
                  boxShadow: '0 20px 40px -10px rgba(10, 25, 47, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  margin: '0 auto var(--spacing-4)',
                  transition: 'all 0.4s ease',
                  border: isFrozen ? '2px dashed rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {/* Metallic holographic highlight shimmer */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-60%',
                    left: '-20%',
                    width: '140%',
                    height: '140%',
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Frozen Overlay */}
                {isFrozen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      zIndex: 10,
                      color: '#EF4444',
                    }}
                  >
                    <Lock size={36} />
                    <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Profile Marked Frozen
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      External payment processing is not controlled here.
                    </span>
                  </div>
                )}

                {/* Top Card Row: Brand + Contactless */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.12em', color: '#FFFFFF' }}>
                      FINSERV
                    </span>
                    <span style={{ fontSize: '9px', display: 'block', color: 'var(--brand-accent)', letterSpacing: '0.18em', fontWeight: 700 }}>
                      VIRTUAL CARD PROFILE
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Wifi size={22} style={{ transform: 'rotate(90deg)', opacity: 0.8 }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255, 255, 255, 0.7)' }}>
                      VIRTUAL
                    </span>
                  </div>
                </div>

                {/* Middle Row: Gold EMV Chip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
                  {/* EMV Chip SVG graphic */}
                  <svg width="42" height="32" viewBox="0 0 42 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="42" height="32" rx="4" fill="#D4AF37" />
                    <rect x="1" y="1" width="40" height="30" rx="3" stroke="#FDE047" strokeWidth="0.8" />
                    <line x1="14" y1="0" x2="14" y2="32" stroke="#A16207" strokeWidth="0.8" />
                    <line x1="28" y1="0" x2="28" y2="32" stroke="#A16207" strokeWidth="0.8" />
                    <line x1="0" y1="16" x2="42" y2="16" stroke="#A16207" strokeWidth="0.8" />
                    <circle cx="21" cy="16" r="4" fill="#CA8A04" />
                  </svg>

                  <span style={{ fontSize: '11px', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Account ending in {activeCard.accountNumber.slice(-4)}
                  </span>
                </div>

                {/* The application stores no usable card credentials. */}
                <div style={{ zIndex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '19px',
                      letterSpacing: '0.18em',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                      marginBottom: '8px',
                    }}
                  >
                    FINServ profile preview
                  </div>

                  {/* Bottom Row: Profile holder + stored expiry */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <span style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Cardholder Name
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {activeCard.cardholderName}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Profile Expiry
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>
                        {String(activeCard.expiryMonth).padStart(2, '0')}/{String(activeCard.expiryYear).slice(-2)}
                      </div>
                    </div>

                    <div style={{ fontStyle: 'italic', fontWeight: 900, fontSize: '18px', letterSpacing: '0.05em' }}>
                      FINServ
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons under card */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-3)', maxWidth: '440px', margin: '0 auto' }}>
                <Button
                  variant={isFrozen ? 'primary' : 'danger'}
                  size="sm"
                  onClick={toggleFreeze}
                  disabled={savingControls}
                >
                  {isFrozen ? <Unlock size={14} style={{ marginRight: '6px' }} /> : <Lock size={14} style={{ marginRight: '6px' }} />}
                  {isFrozen ? 'Mark Profile Active' : 'Mark Profile Frozen'}
                </Button>
              </div>
            </div>

            {/* Security Controls Column */}
            <div>
              <Card style={{ padding: 'var(--spacing-6)', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)' }}>
                  <Shield size={20} color="var(--brand-primary)" />
                  <div>
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Saved Profile Settings
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      These settings are stored in FinServ but are not applied to external payment processing.
                    </span>
                  </div>
                </div>

                {/* Kill Switch Banner */}
                <div
                  style={{
                    background: isFrozen ? 'var(--danger-subtle)' : 'var(--surface-secondary)',
                    border: '1px solid ' + (isFrozen ? 'var(--danger-border)' : 'var(--border-subtle)'),
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-6)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                      {isFrozen ? 'Profile status: Frozen' : 'Profile status: Active'}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      This status does not block payments processed by an external card network.
                    </span>
                  </div>
                  <Switch
                    checked={isFrozen}
                    onCheckedChange={toggleFreeze}
                    disabled={savingControls}
                    aria-label={isFrozen ? 'Mark card profile active' : 'Mark card profile frozen'}
                  />
                </div>

                {/* Channel Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                  {/* Online / E-commerce Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <ShoppingBag size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Online transactions setting
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Stored on this profile; not enforced against transactions.
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={activeCard.onlineTransactionsEnabled}
                      aria-label="Online transactions setting"
                      onCheckedChange={(val) =>
                        void handleUpdateControls(
                          { onlineTransactionsEnabled: val },
                          'Online profile setting saved.'
                        )
                      }
                      disabled={isFrozen || savingControls}
                    />
                  </div>

                  {/* Tap & Pay Contactless Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <Wifi size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Contactless setting
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Stored on this profile; not enforced against transactions.
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={activeCard.contactlessEnabled}
                      aria-label="Contactless setting"
                      onCheckedChange={(val) =>
                        void handleUpdateControls(
                          { contactlessEnabled: val },
                          'Contactless profile setting saved.'
                        )
                      }
                      disabled={isFrozen || savingControls}
                    />
                  </div>

                  {/* International Payments Switch */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <Globe size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          International usage setting
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Stored on this profile; not enforced against transactions.
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={activeCard.internationalEnabled}
                      aria-label="International usage setting"
                      onCheckedChange={(val) =>
                        void handleUpdateControls(
                          { internationalEnabled: val },
                          'International profile setting saved.'
                        )
                      }
                      disabled={isFrozen || savingControls}
                    />
                  </div>
                </div>

                {/* Daily Spend Limit Slider */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: 'var(--spacing-5)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                      <Sliders size={16} color="var(--brand-primary)" />
                      <label htmlFor="daily-profile-limit" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Daily Profile Limit
                      </label>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {formatINR(dailyLimit)}
                    </span>
                  </div>

                  <input
                    id="daily-profile-limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    disabled={isFrozen || savingControls}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-3)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-4)',
                    }}
                  />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveLimit}
                        disabled={
                          isFrozen ||
                          savingControls ||
                          !Number.isFinite(dailyLimit) ||
                          dailyLimit < 0 ||
                          dailyLimit === Number(activeCard.dailySpendLimit)
                        }
                      >
                        {savingControls ? (
                          <>
                            <Spinner size={14} style={{ marginRight: '6px' }} /> Saving...
                          </>
                        ) : (
                          'Save Profile Limit'
                        )}
                      </Button>
                    </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
