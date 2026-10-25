import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingFallback } from '@/components/common/LoadingFallback';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireVerifiedCustomer?: boolean;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerifiedCustomer = false,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingFallback message="Verifying secure banking session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isCustomer = user.roles.includes('ROLE_CUSTOMER');
  if (requireVerifiedCustomer && !isCustomer) {
    const isStaff = user.roles.some((role) =>
      ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'].includes(role)
    );
    return <Navigate to={isStaff ? '/admin/dashboard' : '/login'} replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      const isStaff = user.roles.some((r) =>
        ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_EMPLOYEE'].includes(r)
      );
      return <Navigate to={isStaff ? '/admin/dashboard' : '/app/dashboard'} replace />;
    }
  }
  // If customer is not yet an active verified customer, route customer to onboarding flow
  // If customer is not yet an active verified customer, route customer to onboarding flow
  if (requireVerifiedCustomer && isCustomer && user.status !== 'ACTIVE') {
    return <Navigate to="/onboarding" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
