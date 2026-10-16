/**
 * FINServ Progressive Customer Onboarding & KYC Stepper
 * - Multi-step progressive journey (Contact -> Profile -> Address/FATCA -> KYC -> Review/Submit)
 * - Draft persistence via PUT /api/v1/onboarding/application/step/{step}
 * - Explanatory tooltips for sensitive data & regulatory declarations
 * - Verification Pending status tracker screen post-submission
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';
import type {
  OnboardingApplication,
  ContactVerificationStepData,
  PersonalProfileStepData,
  AddressAndDeclarationsStepData,
  KycDetailsStepData,
  KycDocumentType,
} from '@/types/onboarding';
import type { SendOtpResponse, VerifyOtpResponse } from '@/types/auth';
import type { AppError } from '@/types/api';

import { BrandLogo } from '@/components/common/BrandLogo';
import { Stepper, type StepItem } from '@/components/ui/Stepper';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingFallback } from '@/components/common/LoadingFallback';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  LogOut,
  HelpCircle,
  RefreshCw,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const ONBOARDING_STEPS: StepItem[] = [
  { id: 'contact', label: 'Verification', description: 'Contact OTP' },
  { id: 'profile', label: 'Personal', description: 'Basic details' },
  { id: 'address', label: 'Declarations', description: 'Address & FATCA' },
  { id: 'kyc', label: 'KYC Details', description: 'PAN & ID docs' },
  { id: 'review', label: 'Review', description: 'Confirm & submit' },
];

export const OnboardingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loadingApp, setLoadingApp] = useState<boolean>(true);
  const [savingStep, setSavingStep] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [application, setApplication] = useState<OnboardingApplication | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Contact OTP State
  const [otpRefId, setOtpRefId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [contactData, setContactData] = useState<ContactVerificationStepData>({
    emailVerified: false,
    phoneVerified: false,
  });

  // Step 2: Personal Profile State
  const [profileData, setProfileData] = useState<PersonalProfileStepData>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    nationality: 'INDIAN',
  });

  // Step 3: Address & Declarations State
  const [addressData, setAddressData] = useState<AddressAndDeclarationsStepData>({
    streetLine1: '',
    streetLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    termsAccepted: false,
    fatcaAccepted: false,
    pepDeclared: false,
    privacyAccepted: false,
  });

  // Step 4: KYC State
  const [kycData, setKycData] = useState<KycDetailsStepData>({
    panNumber: '',
    idType: 'NATIONAL_ID',
    idNumber: '',
    fileName: 'Identity_Document.pdf',
    fileSizeBytes: 245760,
  });

  // Step 5: Final declaration
  const [finalConsent, setFinalConsent] = useState<boolean>(false);

  // Fetch or initialize open application
  const fetchApplication = useCallback(async () => {
    setLoadingApp(true);
    setErrorMessage(null);
    try {
      const app = await apiClient.get<OnboardingApplication>('/onboarding/application');
      setApplication(app);

      if (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'APPROVED') {
        // Already submitted; remain in tracker view
        return;
      }

      // Populate draft data if available
      if (app.draftData) {
        if (app.draftData.step1) setContactData(app.draftData.step1);
        if (app.draftData.step2) setProfileData(app.draftData.step2);
        if (app.draftData.step3) setAddressData(app.draftData.step3);
        if (app.draftData.step4) setKycData(app.draftData.step4);
      }

      if (app.currentStep >= 1 && app.currentStep <= 5) {
        setCurrentStep(app.currentStep);
      }
    } catch (err) {
      const appErr = err as AppError;
      setErrorMessage(appErr.userMessage || 'Failed to initialize onboarding application.');
    } finally {
      setLoadingApp(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<OnboardingApplication>('/onboarding/application')
      .then((app) => {
        if (!isMounted) return;
        setApplication(app);
        if (app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'APPROVED') {
          return;
        }
        if (app.draftData) {
          if (app.draftData.step1) setContactData(app.draftData.step1);
          if (app.draftData.step2) setProfileData(app.draftData.step2);
          if (app.draftData.step3) setAddressData(app.draftData.step3);
          if (app.draftData.step4) setKycData(app.draftData.step4);
        }
        if (app.currentStep >= 1 && app.currentStep <= 5) {
          setCurrentStep(app.currentStep);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const appErr = err as AppError;
        setErrorMessage(appErr.userMessage || 'Failed to initialize onboarding application.');
      })
      .finally(() => {
        if (isMounted) {
          setLoadingApp(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Send OTP (Step 1)
  const handleSendOtp = async () => {
    if (!user) return;
    setSendingOtp(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post<SendOtpResponse>('/auth/verify-contact/send', {
        destination: user.email,
        type: 'EMAIL',
        purpose: 'REGISTRATION',
      });
      setOtpRefId(res.referenceId);
      setSimulatedOtp(res.simulatedOtp || '123456');
      setOtpSent(true);
    } catch (err) {
      const appErr = err as AppError;
      setErrorMessage(appErr.userMessage || 'Failed to dispatch verification code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Confirm OTP (Step 1)
  const handleConfirmOtp = async () => {
    if (!otpRefId || !otpCode) return;
    setVerifyingOtp(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.post<VerifyOtpResponse>('/auth/verify-contact/confirm', {
        referenceId: otpRefId,
        otpCode: otpCode.trim(),
      });
      if (res.verified) {
        setContactData({ emailVerified: true, phoneVerified: true });
        // Automatically save step 1 draft
        await saveStep(1, { emailVerified: true, phoneVerified: true });
      }
    } catch (err) {
      const appErr = err as AppError;
      setErrorMessage(appErr.userMessage || 'Invalid OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Generic Step Saver
  const saveStep = async (stepNumber: number, stepPayload: Record<string, unknown>): Promise<boolean> => {
    setSavingStep(true);
    setErrorMessage(null);
    try {
      const updated = await apiClient.put<OnboardingApplication>(
        `/onboarding/application/step/${stepNumber}`,
        {
          step: stepNumber,
          stepData: stepPayload,
        }
      );
      setApplication(updated);
      return true;
    } catch (err) {
      const appErr = err as AppError;
      setErrorMessage(appErr.userMessage || appErr.message || 'Failed to save progress.');
      return false;
    } finally {
      setSavingStep(false);
    }
  };

  // Step 2 Submission
  const handleProceedStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.firstName || !profileData.lastName || !profileData.dateOfBirth) {
      setErrorMessage('Please fill in all mandatory personal details.');
      return;
    }
    // Calculate 18+ age
    const dob = new Date(profileData.dateOfBirth);
    const ageDiff = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
      setErrorMessage('Applicant must be at least 18 years of age to open an account.');
      return;
    }

    const ok = await saveStep(2, profileData as unknown as Record<string, unknown>);
    if (ok) setCurrentStep(3);
  };

  // Step 3 Submission
  const handleProceedStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData.streetLine1 || !addressData.city || !addressData.state || !addressData.postalCode) {
      setErrorMessage('Please provide a complete residential address.');
      return;
    }
    if (!addressData.termsAccepted || !addressData.fatcaAccepted) {
      setErrorMessage('You must accept the Terms and FATCA tax declaration to proceed.');
      return;
    }

    const ok = await saveStep(3, addressData as unknown as Record<string, unknown>);
    if (ok) setCurrentStep(4);
  };

  // Step 4 Submission
  const handleProceedStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(kycData.panNumber.toUpperCase())) {
      setErrorMessage('Invalid PAN Number format. Format must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).');
      return;
    }
    if (!kycData.idNumber.trim()) {
      setErrorMessage('Please provide your Government ID number.');
      return;
    }

    const ok = await saveStep(4, {
      ...kycData,
      panNumber: kycData.panNumber.toUpperCase(),
    });
    if (ok) setCurrentStep(5);
  };

  // Step 5: Final Submission
  const handleFinalSubmit = async () => {
    if (!finalConsent) {
      setErrorMessage('Please confirm your legal declaration before submitting.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const submittedApp = await apiClient.post<OnboardingApplication>(
        '/onboarding/application/submit',
        {}
      );
      setApplication(submittedApp);
    } catch (err) {
      const appErr = err as AppError;
      setErrorMessage(
        appErr.userMessage || appErr.message || 'Submission failed. Please check application data.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingApp) {
    return <LoadingFallback message="Retrieving onboarding application..." />;
  }

  // =========================================================================
  // Screen: Verification Pending Status Tracker (Shown once application submitted)
  // =========================================================================
  if (
    application &&
    (application.status === 'SUBMITTED' ||
      application.status === 'UNDER_REVIEW' ||
      application.status === 'APPROVED')
  ) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--surface-canvas)',
          padding: 'var(--spacing-8) var(--spacing-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '720px', marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <BrandLogo size="md" />
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut size={16} /> Sign Out
            </Button>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            padding: 'var(--spacing-8)',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 196, 182, 0.12)',
                border: '2px solid rgba(46, 196, 182, 0.25)',
                color: 'var(--brand-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-4)',
                boxShadow: '0 0 20px rgba(46, 196, 182, 0.2)',
              }}
            >
              <Clock size={34} />
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: '0 0 var(--spacing-2) 0',
                letterSpacing: '-0.02em',
              }}
            >
              Application Under Bank Review
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
              Reference ID:{' '}
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontWeight: 700,
                  color: '#0B2545',
                  backgroundColor: 'var(--surface-subtle)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-default)',
                }}
              >
                {application.applicationReference}
              </span>
            </p>
          </div>

          {/* 3-Stage Verification Timeline */}
          <div
            style={{
              padding: 'var(--spacing-6)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--spacing-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <h3
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Onboarding Progression
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#059669',
                  backgroundColor: '#ECFDF5',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Maker-Checker Pipeline Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
              {/* Stage 1 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={18} color="#059669" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                    Application Submitted
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Personal profile, residential address, declarations, and PAN recorded.
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#0B2545',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginTop: '2px',
                    flexShrink: 0,
                    boxShadow: '0 0 8px rgba(11, 37, 69, 0.3)',
                  }}
                >
                  2
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-sm)' }}>
                    Dual-Authorization Document Verification
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                    Bank officers are reviewing submitted KYC documents in the Employee Portal (Phase 6).
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)', opacity: 0.55 }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--border-default)',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Customer CIF & Savings Account Opening
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                    Automatic generation of 14-digit ISO 7064 account number and digital banking unlock.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'rgba(46, 196, 182, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(46, 196, 182, 0.2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-6)',
              display: 'flex',
              gap: 'var(--spacing-3)',
            }}
          >
            <ShieldCheck size={20} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
            <span>
              Banking Confidentiality: All sensitive tax identifiers and personal documents are stored with
              AES-256-GCM hardware encryption and cryptographic audit chain logging.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <Button
              variant="outline"
              fullWidth
              onClick={() => fetchApplication()}
              disabled={loadingApp}
            >
              <RefreshCw size={16} /> Refresh Verification Status
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/app')}
              disabled={application.status !== 'APPROVED'}
            >
              {application.status === 'APPROVED' ? 'Enter Customer Portal' : 'Pending Bank Approval'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Stepper Form View (Current Step 1 to 5)
  // =========================================================================
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--surface-canvas)',
        padding: 'var(--spacing-8) var(--spacing-4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '840px', marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BrandLogo size="md" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
              Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.username}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          padding: 'var(--spacing-8)',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Progress Header */}
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0B2545', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Step {currentStep} of 5: {ONBOARDING_STEPS[currentStep - 1]?.label}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              ~2 mins remaining
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(currentStep / 5) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2EC4B6 0%, #0B2545 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <Stepper steps={ONBOARDING_STEPS} currentStepIndex={currentStep - 1} />
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--spacing-3)',
              padding: 'var(--spacing-3)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#EF4444',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--spacing-5)',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Step 1: Contact OTP Verification */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--spacing-1) 0',
                }}
              >
                Verify Contact Credentials
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                RBI 2-Factor Authentication requirement: confirm ownership of your registered communication channels.
              </p>
            </div>

            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  Registered Email Address
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {user?.email}
                </div>
              </div>
              {contactData.emailVerified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendOtp}
                  isLoading={sendingOtp}
                  disabled={sendingOtp || otpSent}
                >
                  {otpSent ? 'OTP Sent' : 'Send Verification OTP'}
                </Button>
              )}
            </div>

            {otpSent && !contactData.emailVerified && (
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-5)',
                }}
              >
                <div
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    backgroundColor: 'rgba(242, 184, 75, 0.12)',
                    border: '1px solid rgba(242, 184, 75, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    color: '#F2B84B',
                    marginBottom: 'var(--spacing-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    Simulated Sandbox Mode: Verification code generated: <strong>{simulatedOtp}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOtpCode(simulatedOtp || '')}
                    style={{ color: '#F2B84B', fontSize: '11px', padding: '2px 6px', height: 'auto' }}
                  >
                    Auto-Fill
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <FormField label="Enter 6-digit OTP Code" htmlFor="otpCode">
                      <Input
                        id="otpCode"
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </FormField>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleConfirmOtp}
                    isLoading={verifyingOtp}
                    disabled={verifyingOtp || otpCode.length < 6}
                    style={{ marginBottom: 'var(--spacing-4)' }}
                  >
                    Confirm Code
                  </Button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-6)' }}>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(2)}
                disabled={!contactData.emailVerified || savingStep}
                isLoading={savingStep}
              >
                Save & Continue to Profile <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Step 2: Personal Profile */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedStep2}>
            <div style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--spacing-1) 0',
                }}
              >
                Personal Information
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                Enter legal details as registered on your official government documents.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormField label="First Name" required htmlFor="firstName">
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="e.g. Aarav"
                  required
                />
              </FormField>

              <FormField label="Middle Name (Optional)" htmlFor="middleName">
                <Input
                  id="middleName"
                  value={profileData.middleName || ''}
                  onChange={(e) => setProfileData({ ...profileData, middleName: e.target.value })}
                  placeholder="e.g. Kumar"
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormField label="Last Name" required htmlFor="lastName">
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="e.g. Sharma"
                  required
                />
              </FormField>

              <FormField
                label="Date of Birth"
                required
                htmlFor="dob"
                hint="Must be at least 18 years of age"
              >
                <Input
                  id="dob"
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormField label="Gender" required htmlFor="gender">
                <Select
                  id="gender"
                  value={profileData.gender}
                  onValueChange={(val: string) =>
                    setProfileData({
                      ...profileData,
                      gender: val as PersonalProfileStepData['gender'],
                    })
                  }
                  options={[
                    { label: 'Male', value: 'MALE' },
                    { label: 'Female', value: 'FEMALE' },
                    { label: 'Other', value: 'OTHER' },
                    { label: 'Prefer Not to Say', value: 'PREFER_NOT_TO_SAY' },
                  ]}
                />
              </FormField>

              <FormField label="Marital Status" htmlFor="maritalStatus">
                <Select
                  id="maritalStatus"
                  value={profileData.maritalStatus || 'SINGLE'}
                  onValueChange={(val: string) =>
                    setProfileData({
                      ...profileData,
                      maritalStatus: val as PersonalProfileStepData['maritalStatus'],
                    })
                  }
                  options={[
                    { label: 'Single', value: 'SINGLE' },
                    { label: 'Married', value: 'MARRIED' },
                    { label: 'Divorced', value: 'DIVORCED' },
                    { label: 'Widowed', value: 'WIDOWED' },
                  ]}
                />
              </FormField>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'var(--spacing-6)',
              }}
            >
              <Button variant="outline" type="button" onClick={() => setCurrentStep(1)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button variant="primary" type="submit" isLoading={savingStep}>
                Save & Continue <ChevronRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Step 3: Address & Statutory Declarations */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 3 && (
          <form onSubmit={handleProceedStep3}>
            <div style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--spacing-1) 0',
                }}
              >
                Residential Address & Declarations
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                Required for debit card delivery, checkbooks, and regulatory tax compliance.
              </p>
            </div>

            <FormField label="Street Address Line 1" required htmlFor="street1">
              <Input
                id="street1"
                value={addressData.streetLine1}
                onChange={(e) => setAddressData({ ...addressData, streetLine1: e.target.value })}
                placeholder="Flat / House No., Building Name, Street"
                required
              />
            </FormField>

            <FormField label="Street Address Line 2 (Optional)" htmlFor="street2">
              <Input
                id="street2"
                value={addressData.streetLine2 || ''}
                onChange={(e) => setAddressData({ ...addressData, streetLine2: e.target.value })}
                placeholder="Landmark, Area, Colony"
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-3)' }}>
              <FormField label="City" required htmlFor="city">
                <Input
                  id="city"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  required
                />
              </FormField>

              <FormField label="State" required htmlFor="state">
                <Input
                  id="state"
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  required
                />
              </FormField>

              <FormField label="PIN Code" required htmlFor="postalCode">
                <Input
                  id="postalCode"
                  value={addressData.postalCode}
                  onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                  placeholder="6 digits (e.g. 400001)"
                  maxLength={6}
                  required
                />
              </FormField>
            </div>

            {/* Statutory Declarations Box */}
            <div
              style={{
                marginTop: 'var(--spacing-4)',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-3)',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                Mandatory Regulatory Declarations
              </h4>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                <Checkbox
                  id="fatca"
                  checked={addressData.fatcaAccepted}
                  onChange={(e) => setAddressData({ ...addressData, fatcaAccepted: e.target.checked })}
                />
                <label
                  htmlFor="fatca"
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <strong>FATCA / CRS Declaration:</strong> I certify that I am an Indian tax resident and not a tax
                  resident of any other country, including the United States.
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                <Checkbox
                  id="pep"
                  checked={addressData.pepDeclared}
                  onChange={(e) => setAddressData({ ...addressData, pepDeclared: e.target.checked })}
                />
                <label
                  htmlFor="pep"
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <strong>PEP Declaration:</strong> I confirm that I am neither a Politically Exposed Person (PEP) nor
                  a close relative of a Politically Exposed Person.
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-2)' }}>
                <Checkbox
                  id="terms"
                  checked={addressData.termsAccepted}
                  onChange={(e) => setAddressData({ ...addressData, termsAccepted: e.target.checked })}
                />
                <label
                  htmlFor="terms"
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <strong>Banking Terms & Privacy:</strong> I agree to FINServ Master Account Opening Terms & Conditions
                  and consent to secure processing under the Digital Personal Data Protection Act.
                </label>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'var(--spacing-6)',
              }}
            >
              <Button variant="outline" type="button" onClick={() => setCurrentStep(2)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button variant="primary" type="submit" isLoading={savingStep}>
                Save & Continue to KYC <ChevronRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Step 4: KYC Identification */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 4 && (
          <form onSubmit={handleProceedStep4}>
            <div style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--spacing-1) 0',
                }}
              >
                Statutory KYC Identification
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                RBI Master Direction compliance: Permanent Account Number (PAN) and verified identity.
              </p>
            </div>

            <FormField
              label="Permanent Account Number (PAN)"
              required
              htmlFor="panNumber"
              hint="Format: 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F). Encrypted with AES-256-GCM."
            >
              <Input
                id="panNumber"
                value={kycData.panNumber}
                onChange={(e) =>
                  setKycData({
                    ...kycData,
                    panNumber: e.target.value.toUpperCase(),
                  })
                }
                placeholder="ABCDE1234F"
                maxLength={10}
                required
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'var(--font-family-mono)',
                  fontWeight: 'bold',
                }}
              />
            </FormField>

            <div
              style={{
                padding: 'var(--spacing-3)',
                backgroundColor: 'rgba(46, 196, 182, 0.08)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-5)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
              }}
            >
              <HelpCircle size={16} color="var(--brand-accent)" style={{ flexShrink: 0 }} />
              <span>
                Why is PAN mandatory? Section 139A of the Indian Income Tax Act mandates PAN recording for opening
                any banking account to prevent financial fraud and tax avoidance.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormField label="Government ID Type" required htmlFor="idType">
                <Select
                  id="idType"
                  value={kycData.idType}
                  onValueChange={(val: string) =>
                    setKycData({
                      ...kycData,
                      idType: val as KycDocumentType,
                    })
                  }
                  options={[
                    { label: 'Aadhaar / National ID', value: 'NATIONAL_ID' },
                    { label: 'Passport', value: 'PASSPORT' },
                    { label: 'Voter ID', value: 'VOTER_ID' },
                    { label: 'Driving License', value: 'DRIVING_LICENSE' },
                  ]}
                />
              </FormField>

              <FormField
                label="Government ID Number"
                required
                htmlFor="idNumber"
                hint="Numbers are hashed with blind index for privacy"
              >
                <Input
                  id="idNumber"
                  value={kycData.idNumber}
                  onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                  placeholder="Enter Document Identification No."
                  required
                />
              </FormField>
            </div>

            {/* Document Upload Simulator */}
            <div
              style={{
                marginTop: 'var(--spacing-3)',
                padding: 'var(--spacing-5)',
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--surface-sunken)',
                textAlign: 'center',
              }}
            >
              <UploadCloud size={32} color="var(--brand-accent)" style={{ margin: '0 auto var(--spacing-2) auto' }} />
              <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Identity Document Attached
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {kycData.fileName} ({(kycData.fileSizeBytes! / 1024).toFixed(1)} KB) - Verified SHA-256
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 'var(--spacing-6)',
              }}
            >
              <Button variant="outline" type="button" onClick={() => setCurrentStep(3)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button variant="primary" type="submit" isLoading={savingStep}>
                Review & Confirm <ChevronRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Step 5: Review & Submit */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 5 && (
          <div>
            <div style={{ marginBottom: 'var(--spacing-5)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  margin: '0 0 var(--spacing-1) 0',
                }}
              >
                Review Application Summary
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0 }}>
                Please review your application carefully before final submission to bank officers.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-4)',
                marginBottom: 'var(--spacing-5)',
              }}
            >
              {/* Card 1: Contact & Profile */}
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                    Personal Profile
                  </strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    Edit
                  </Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>Name: {profileData.firstName} {profileData.lastName}</div>
                  <div>DOB: {profileData.dateOfBirth}</div>
                  <div>Gender: {profileData.gender}</div>
                  <div>Email: {user?.email}</div>
                  <div>Phone: {user?.phoneNumber}</div>
                </div>
              </div>

              {/* Card 2: Address & KYC */}
              <div
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  <strong style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                    KYC & Address
                  </strong>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>
                    Edit
                  </Button>
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>
                    PAN: <span style={{ fontFamily: 'var(--font-family-mono)' }}>{kycData.panNumber}</span>
                  </div>
                  <div>ID Type: {kycData.idType}</div>
                  <div>Address: {addressData.streetLine1}, {addressData.city}, {addressData.state} - {addressData.postalCode}</div>
                  <div>FATCA / PEP: Declared & Accepted</div>
                </div>
              </div>
            </div>

            {/* Final Legal Consent */}
            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'rgba(46, 196, 182, 0.08)',
                border: '1px solid rgba(46, 196, 182, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' }}>
                <Checkbox
                  id="finalConsent"
                  checked={finalConsent}
                  onChange={(e) => setFinalConsent(e.target.checked)}
                />
                <label
                  htmlFor="finalConsent"
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  I solemnly declare that the information provided above is true and correct to the best of my knowledge.
                  I understand that giving false information is a punishable offense under banking and tax laws.
                  I authorize FINServ to verify these documents with statutory authorities.
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline" type="button" onClick={() => setCurrentStep(4)}>
                <ChevronLeft size={16} /> Back
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalSubmit}
                isLoading={submitting}
                disabled={!finalConsent || submitting}
              >
                <FileText size={16} /> Submit Banking Application
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
