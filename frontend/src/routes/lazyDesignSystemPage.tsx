import { lazy } from 'react';

export const DesignSystemPage = import.meta.env.DEV
  ? lazy(() =>
      import('@/features/design-system/DesignSystemPage').then(({ DesignSystemPage }) => ({
        default: DesignSystemPage,
      }))
    )
  : null;
