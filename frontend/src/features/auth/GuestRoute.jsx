import { useSearchParams } from 'react-router';

import { CenteredLayout } from '@/components/CenteredLayout';
import { LoadingState } from '@/components/LoadingState';

import { SignedInRedirect } from './SignedInRedirect';
import { useAuth } from './use-auth';

/**
 * @typedef {object} GuestRouteProps
 * @property {import('react').ReactNode} children
 */

/**
 * @param {GuestRouteProps} props
 */
export function GuestRoute({ children }) {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'loading') {
    return (
      <CenteredLayout>
        <LoadingState />
      </CenteredLayout>
    );
  }

  if (status === 'authenticated') {
    return <SignedInRedirect nextPath={searchParams.get('next')} />;
  }

  return children;
}
