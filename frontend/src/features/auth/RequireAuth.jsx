import { Navigate, Outlet, useLocation } from 'react-router';

import { CenteredLayout } from '@/components/CenteredLayout';
import { LoadingState } from '@/components/LoadingState';

import { useAuth } from './use-auth';

/**
 * Layout gate for authenticated routes.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <CenteredLayout>
        <LoadingState />
      </CenteredLayout>
    );
  }

  if (status === 'anonymous') {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?next=${encodeURIComponent(next)}`} replace />;
  }

  return <Outlet />;
}
