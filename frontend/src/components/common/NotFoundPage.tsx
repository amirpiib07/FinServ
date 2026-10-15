/**
 * 404 Not Found Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Home, HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)',
      }}
    >
      <EmptyState
        icon={<HelpCircle size={32} />}
        title="404 — Page Not Found"
        description="The banking resource, account view, or service page you requested does not exist or has been moved."
        action={
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="primary" leftIcon={<Home size={16} />}>
              Return to Home
            </Button>
          </Link>
        }
      />
    </div>
  );
};
