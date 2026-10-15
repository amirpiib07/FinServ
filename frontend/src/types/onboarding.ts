/**
 * Progressive Customer Onboarding & KYC Types for FINServ
 */

export interface ContactVerificationStepData {
  emailVerified: boolean;
  phoneVerified?: boolean;
}

export interface PersonalProfileStepData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  nationality?: string;
}

export interface AddressAndDeclarationsStepData {
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  termsAccepted: boolean;
  fatcaAccepted: boolean;
  pepDeclared: boolean;
  privacyAccepted: boolean;
}

export type KycDocumentType = 'NATIONAL_ID' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE';

export interface KycDetailsStepData {
  panNumber: string;
  idType: KycDocumentType;
  idNumber: string;
  fileName?: string;
  fileSizeBytes?: number;
}

export interface OnboardingDraftData {
  step1?: ContactVerificationStepData;
  step2?: PersonalProfileStepData;
  step3?: AddressAndDeclarationsStepData;
  step4?: KycDetailsStepData;
  [key: string]: unknown;
}

export interface OnboardingApplication {
  id: string;
  applicationReference: string;
  currentStep: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  draftData: OnboardingDraftData;
  submittedAt: string | null;
  rejectionReason: string | null;
}

export interface SaveStepPayload {
  step: number;
  stepData: Record<string, unknown>;
}
