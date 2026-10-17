/**
 * FINServ Application Root
 * Configures React Query, Global Toasts, Error Boundary, and Router
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { ToastProvider } from '@/context/ToastProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { ThemeProvider } from '@/context/ThemeProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <RouterProvider router={router} />
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
