/**
 * FINServ Living Design System Showcase Page
 * Development-only route (/design-system)
 * Provides an interactive living catalog of every component, state, token, and health probe.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup } from '@/components/ui/Radio';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, StatusPill } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs } from '@/components/ui/Tabs';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Stepper } from '@/components/ui/Stepper';
import { AmountDisplay } from '@/components/ui/AmountDisplay';
import { HealthWidget } from '@/features/health/HealthWidget';
import { useToast } from '@/hooks/useToast';
import { formatDateIST, formatTimeIST } from '@/lib/dates';
import { maskAccountNumber, maskPhoneNumber, maskEmail, maskPan } from '@/lib/masking';
import { indianMobileSchema, panSchema, amountSchema } from '@/lib/validation';
import {
  Send,
  Trash2,
  Search,
  Check,
  IndianRupee,
  Shield,
  Palette,
} from 'lucide-react';

export const DesignSystemPage: React.FC = () => {
  const toast = useToast();

  // Interactive Component States
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form controls states
  const [selectVal, setSelectVal] = useState('savings');
  const [chkChecked, setChkChecked] = useState(true);
  const [chkIndeterminate, setChkIndeterminate] = useState(true);
  const [radioVal, setRadioVal] = useState('neft');
  const [switchVal, setSwitchVal] = useState(true);

  // Live Zod Validation Playground
  const [mobileInput, setMobileInput] = useState('9876543210');
  const [mobileError, setMobileError] = useState<string | undefined>();

  const [panInput, setPanInput] = useState('ABCDE1234F');
  const [panError, setPanError] = useState<string | undefined>();

  const [amountInput, setAmountInput] = useState('125000.50');
  const [amountError, setAmountError] = useState<string | undefined>();

  // Stepper state
  const [activeStep, setActiveStep] = useState(2);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Handle live mobile validation
  const handleMobileChange = (val: string) => {
    setMobileInput(val);
    const res = indianMobileSchema.safeParse(val);
    if (!res.success) {
      setMobileError(res.error.errors[0]?.message);
    } else {
      setMobileError(undefined);
    }
  };

  // Handle live PAN validation
  const handlePanChange = (val: string) => {
    setPanInput(val);
    const res = panSchema.safeParse(val);
    if (!res.success) {
      setPanError(res.error.errors[0]?.message);
    } else {
      setPanError(undefined);
    }
  };

  // Handle live Amount validation
  const handleAmountChange = (val: string) => {
    setAmountInput(val);
    const res = amountSchema({ min: '1.00', max: '5000000.00' }).safeParse(val);
    if (!res.success) {
      setAmountError(res.error.errors[0]?.message);
    } else {
      setAmountError(undefined);
    }
  };

  const handleConfirmAction = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setConfirmOpen(false);
      toast.success('Funds transfer confirmed and committed to ledger.', 'Transaction Executed');
    }, 1200);
  };

  // Sample Table Data
  const sampleTableData: {
    id: string;
    ref: string;
    type: string;
    amount: string;
    status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  }[] = [
    { id: 'TXN-101', ref: 'IMPS/987654321', type: 'Credit', amount: '250000.00', status: 'ACTIVE' },
    { id: 'TXN-102', ref: 'NEFT/123456789', type: 'Debit', amount: '12450.50', status: 'PENDING' },
    { id: 'TXN-103', ref: 'UPI/vpa@bank', type: 'Debit', amount: '850.00', status: 'REJECTED' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 'var(--spacing-16)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
          <Badge variant="brand" withDot>
            Living Style Guide & Component Catalog
          </Badge>
          <Badge variant="neutral">DEV ONLY (Tree-shaken from production)</Badge>
        </div>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
          FINServ Token & Component System
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-base)', marginTop: 'var(--spacing-1)' }}>
          Layered design tokens, accessible interactive controls, financial precision utilities, and backend Actuator probes.
        </p>
      </div>

      {/* Backend Live Health Probe Section */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Shield size={20} color="var(--brand-primary)" />
          <span>1. Live Backend Connectivity & Actuator Probe</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-4)' }}>
          The component below queries the real Spring Boot 3.3 backend at <code>/actuator/health</code> via the Vite dev proxy.
        </p>
        <div style={{ maxWidth: 540 }}>
          <HealthWidget />
        </div>
      </section>

      {/* Design Tokens: Color & Surfaces */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Palette size={20} color="var(--brand-primary)" />
          <span>2. Color Palette & Semantic Tokens</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-4)' }}>
          <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-primary)', color: 'var(--brand-contrast)' }}>
            <strong>--brand-primary</strong>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>Brand Deep Royal</div>
          </div>
          <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-canvas)', border: '1px solid var(--border-default)' }}>
            <strong>--surface-canvas</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Page Background</div>
          </div>
          <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
            <strong>--surface-card</strong>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Elevated Card</div>
          </div>
          <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success-text)', border: '1px solid var(--color-success-border)' }}>
            <strong>--color-success</strong>
            <div style={{ fontSize: '11px' }}>Verified / Active</div>
          </div>
          <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning-text)', border: '1px solid var(--color-warning-border)' }}>
            <strong>--color-warning</strong>
            <div style={{ fontSize: '11px' }}>In Review / Pending</div>
          </div>
          <div style={{ padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-subtle)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)' }}>
            <strong>--color-danger</strong>
            <div style={{ fontSize: '11px' }}>Rejected / Frozen</div>
          </div>
        </div>
      </section>

      {/* Buttons & Actions */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
          3. Buttons & Double-Submit Protection
        </h2>
        <Card variant="bordered">
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            {/* Variants */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                Variants
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Action</Button>
                <Button variant="ghost">Ghost Action</Button>
                <Button variant="danger">Danger Action</Button>
                <Button variant="primary" disabled>Disabled State</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                Sizes & Icons
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm">Small (32px)</Button>
                <Button variant="primary" size="md">Medium (40px)</Button>
                <Button variant="primary" size="lg">Large (48px)</Button>
                <Button variant="primary" leftIcon={<Send size={16} />}>Send Transfer</Button>
                <Button variant="danger" rightIcon={<Trash2 size={16} />}>Close Account</Button>
              </div>
            </div>

            {/* Double activation protection demonstration */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                Interactive Double-Click Prevention State
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    toast.info('Simulating network request... double click is blocked.');
                    setTimeout(() => {
                      setBtnLoading(false);
                      toast.success('Operation completed successfully.');
                    }, 2000);
                  }}
                >
                  {btnLoading ? 'Executing Transfer...' : 'Trigger Protected Submit'}
                </Button>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  When loading, button disables itself, shows spinner, and ignores all clicks.
                </span>
              </div>
            </div>

            {/* Icon Buttons */}
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                Accessible IconButtons (Aria-Label Required)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <IconButton aria-label="Search transactions" icon={<Search size={16} />} variant="secondary" />
                <IconButton aria-label="Confirm item" icon={<Check size={16} />} variant="primary" />
                <IconButton aria-label="Delete entry" icon={<Trash2 size={16} />} variant="danger" />
                <IconButton aria-label="Loading icon" icon={<Search size={16} />} isLoading variant="secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Form Controls & Live Zod Validation */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
          4. Form Controls & Live Zod Domain Validation
        </h2>
        <Card variant="bordered">
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              {/* Indian Mobile Field */}
              <FormField
                label="Indian Mobile Number"
                required
                hint="10 digits starting with 6, 7, 8, or 9 (supports +91 prefix)"
                error={mobileError}
              >
                <Input
                  value={mobileInput}
                  onChange={e => handleMobileChange(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </FormField>

              {/* PAN Number Field */}
              <FormField
                label="Permanent Account Number (PAN)"
                required
                hint="Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)"
                error={panError}
              >
                <Input
                  value={panInput}
                  onChange={e => handlePanChange(e.target.value)}
                  placeholder="ABCDE1234F"
                />
              </FormField>

              {/* Amount Field */}
              <FormField
                label="Transfer Amount (INR)"
                required
                hint="Positive decimal, max 2 decimals, min ₹1.00"
                error={amountError}
              >
                <Input
                  prefixIcon={<IndianRupee size={16} />}
                  value={amountInput}
                  onChange={e => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>

              {/* Password Input with show/hide */}
              <FormField
                label="NetBanking Password"
                required
                hint="Click the eye icon to toggle secure visibility"
              >
                <PasswordInput defaultValue="SecureP@ssw0rd!" />
              </FormField>

              {/* Radix Select */}
              <FormField
                label="Account Product"
                required
                hint="Accessible keyboard select dropdown"
              >
                <Select
                  value={selectVal}
                  onValueChange={setSelectVal}
                  options={[
                    { label: 'Savings Classic (Product 01)', value: 'savings' },
                    { label: 'Salary Elite (Product 02)', value: 'salary' },
                    { label: 'Current Standard (Product 03)', value: 'current' },
                    { label: 'Term Deposit Account (Product 04)', value: 'term' },
                  ]}
                />
              </FormField>

              {/* Textarea */}
              <FormField
                label="Transaction Narration"
                hint="Optional reference remarks (max 100 characters)"
              >
                <Textarea placeholder="e.g. Monthly apartment maintenance payment" rows={2} />
              </FormField>
            </div>

            {/* Checkboxes, Radios, Switches */}
            <div style={{ marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-6)', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-6)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                    Checkboxes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    <Checkbox
                      id="chk-terms"
                      label="I agree to RBI Terms & Conditions"
                      checked={chkChecked}
                      onChange={e => setChkChecked(e.target.checked)}
                    />
                    <Checkbox
                      id="chk-indet"
                      label="Indeterminate Batch Status"
                      indeterminate={chkIndeterminate}
                      onChange={() => setChkIndeterminate(!chkIndeterminate)}
                    />
                    <Checkbox
                      id="chk-disabled"
                      label="Disabled Regulatory Requirement"
                      disabled
                      checked
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                    Radio Group (Payment Rail)
                  </div>
                  <RadioGroup
                    name="paymentRail"
                    value={radioVal}
                    onChange={setRadioVal}
                    options={[
                      { label: 'IMPS (Immediate Payment)', value: 'imps' },
                      { label: 'NEFT (National Electronic Transfer)', value: 'neft' },
                      { label: 'RTGS (Real Time Gross Settlement)', value: 'rtgs' },
                    ]}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
                    Switch Controls
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    <Switch
                      label="International Debit Enabled"
                      checked={switchVal}
                      onCheckedChange={setSwitchVal}
                    />
                    <Switch
                      label="ATM Withdrawal Active"
                      checked={true}
                    />
                    <Switch
                      label="Crypto Transfers (Locked by RBI)"
                      disabled
                      checked={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Financial Precision & Masking Utilities */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <IndianRupee size={20} color="var(--brand-primary)" />
          <span>5. Financial Precision Math & PII Masking Utilities</span>
        </h2>
        <Card variant="bordered">
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-6)' }}>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-3)' }}>
                  Indian Digit Grouping (Lakh / Crore)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Small Amount: </span>
                    <AmountDisplay amount="150.25" size="md" />
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Fifty Thousand: </span>
                    <AmountDisplay amount="50000.00" size="md" />
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Ten Lakhs (10,00,000.00): </span>
                    <AmountDisplay amount="1000000.00" size="md" colorBySign />
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Twenty-Five Crores: </span>
                    <AmountDisplay amount="254321987.50" size="lg" colorBySign />
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>Negative Fee/Debit: </span>
                    <AmountDisplay amount="-1250.00" size="md" colorBySign />
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-3)' }}>
                  PII & Account Masking (Display Security)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Account Number: </span>
                    <code>{maskAccountNumber('10010100000017')}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Mobile (+91): </span>
                    <code>{maskPhoneNumber('+919876543210')}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Email: </span>
                    <code>{maskEmail('customer.care@finserv.com')}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>PAN Card: </span>
                    <code>{maskPan('ABCDE1234F')}</code>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-3)' }}>
                  Asia/Kolkata (IST) Timestamps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>UTC Instant: </span>
                    <code style={{ fontSize: '11px' }}>2026-10-15T18:30:00Z</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>IST Date (Midnight Boundary): </span>
                    <strong>{formatDateIST('2026-10-15T18:30:00Z')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>IST Time: </span>
                    <strong>{formatTimeIST('2026-10-15T18:30:00Z', true)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stepper (Progressive Registration) */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
          6. Progressive Onboarding Stepper (Phase 5 Foundation)
        </h2>
        <Card variant="bordered">
          <CardContent>
            <Stepper
              currentStepIndex={activeStep}
              onStepClick={setActiveStep}
              steps={[
                { id: 1, label: 'Credentials', description: 'User & Password' },
                { id: 2, label: 'Contact', description: 'OTP Validation' },
                { id: 3, label: 'Profile', description: 'Personal Details' },
                { id: 4, label: 'Address', description: 'Declarations' },
                { id: 5, label: 'KYC Docs', description: 'Identity Upload' },
                { id: 6, label: 'Review', description: 'Maker-Checker Submit' },
              ]}
            />
            <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', gap: 'var(--spacing-2)' }}>
              <Button
                size="sm"
                variant="secondary"
                disabled={activeStep <= 0}
                onClick={() => setActiveStep(prev => prev - 1)}
              >
                Previous Step
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={activeStep >= 5}
                onClick={() => setActiveStep(prev => prev + 1)}
              >
                Next Step
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Overlays: Modal and ConfirmDialog */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
          7. Accessible Dialogs & Confirmation Modals
        </h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Standard Modal
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open Confirm Action Dialog
          </Button>

          <Modal
            open={modalOpen}
            onOpenChange={setModalOpen}
            title="Account Information Dialog"
            description="Details about savings product specifications and limits."
            footer={
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Dismiss
              </Button>
            }
          >
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              This dialog implements focus trapping, Escape key listener, and backdrop click dismiss via Radix UI primitives.
            </p>
          </Modal>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Confirm Sensitive Transfer"
            description="Are you sure you want to debit ₹1,25,000.50 from Account ••••••••••0017? This action commits balanced debit and credit entries to the immutable ledger."
            confirmLabel="Execute Debit"
            confirmVariant="danger"
            isLoading={confirmLoading}
            onConfirm={handleConfirmAction}
          />
        </div>
      </section>

      {/* Tabs & Table */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
          8. Tabs, Responsive Table & Pagination
        </h2>
        <Card variant="bordered">
          <CardContent>
            <Tabs
              tabs={[
                {
                  id: 'tab-table',
                  label: 'Transaction Ledger Table',
                  content: (
                    <div>
                      <Table
                        columns={[
                          { key: 'id', header: 'Txn ID', width: '120px' },
                          { key: 'ref', header: 'Reference' },
                          {
                            key: 'type',
                            header: 'Type',
                            render: r => (
                              <Badge variant={r.type === 'Credit' ? 'success' : 'danger'}>
                                {r.type}
                              </Badge>
                            ),
                          },
                          {
                            key: 'amount',
                            header: 'Amount (INR)',
                            align: 'right',
                            render: r => (
                              <AmountDisplay
                                amount={r.amount}
                                colorBySign={r.type === 'Credit'}
                              />
                            ),
                          },
                          {
                            key: 'status',
                            header: 'Status',
                            render: r => <StatusPill status={r.status} />,
                          },
                        ]}
                        data={sampleTableData}
                        keyExtractor={r => r.id}
                      />

                      <Pagination
                        currentPage={currentPage}
                        totalPages={5}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  ),
                },
                {
                  id: 'tab-states',
                  label: 'Empty & Error States',
                  content: (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-4)' }}>
                      <EmptyState
                        title="No Beneficiaries Added"
                        description="Add intra-bank or inter-bank payees to initiate immediate fund transfers."
                        action={<Button size="sm" variant="primary">Add Beneficiary</Button>}
                      />
                      <ErrorState
                        title="Ledger Posting Timeout"
                        message="The transaction could not be verified by the host core banking network."
                        correlationId="corr-8db373a8-fd50-42fb-aa37"
                        onRetry={() => toast.info('Retrying ledger verification...')}
                      />
                    </div>
                  ),
                },
                {
                  id: 'tab-skeletons',
                  label: 'Loaders & Shimmers',
                  content: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <Skeleton variant="circular" width={48} height={48} />
                        <div style={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" />
                          <Skeleton variant="text" width="40%" />
                        </div>
                      </div>
                      <Skeleton variant="rectangular" height={100} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <Spinner size={24} style={{ color: 'var(--brand-primary)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>Active Spinner Element</span>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Global Toast Triggers */}
      <section style={{ marginBottom: 'var(--spacing-10)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-4)' }}>
          9. Accessible Toast Alert System
        </h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => toast.success('Customer KYC document provisionally approved.', 'Document Verified')}
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error('Debit failed: Insufficient ledger balance.', 'Transaction Error')}
          >
            Trigger Error Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning('Cooling-off limit applies to new payees for 24 hours.', 'Cooling Off')}
          >
            Trigger Warning Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info('Daily maintenance window scheduled at 02:00 IST.', 'System Notice')}
          >
            Trigger Info Toast
          </Button>
        </div>
      </section>
    </div>
  );
};
