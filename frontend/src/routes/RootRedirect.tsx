import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingFallback } from '@/components/common/LoadingFallback';

export const RootRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback message="Initializing secure banking session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isStaffOrAdmin = user.roles.some((r) =>
    ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'].includes(r)
  );

  if (isStaffOrAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const isCustomer = user.roles.includes('ROLE_CUSTOMER');
  if (isCustomer && user.status !== 'ACTIVE') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
};
