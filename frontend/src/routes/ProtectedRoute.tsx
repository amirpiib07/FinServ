import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingFallback } from '@/components/common/LoadingFallback';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireVerifiedCustomer?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerifiedCustomer = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback message="Verifying secure banking session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If customer is not yet an active verified customer, route customer to onboarding flow
  const isCustomer = user.roles.includes('ROLE_CUSTOMER');
  if (requireVerifiedCustomer && isCustomer && user.status !== 'ACTIVE') {
    return <Navigate to="/onboarding" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
