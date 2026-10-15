/**
 * FINServ useToast Hook
 */

import { useContext } from 'react';
import { ToastContext, ToastContextValue, ToastItem, ToastType } from '@/context/ToastContext';

export type { ToastItem, ToastType, ToastContextValue };

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
