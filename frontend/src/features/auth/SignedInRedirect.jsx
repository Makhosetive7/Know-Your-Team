import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import { CenteredLayout } from '@/components/CenteredLayout';
import { LoadingState } from '@/components/LoadingState';
import { resolveSignedInPath } from '@/lib/signed-in-home';
import { ApiError } from '@/services/http';

/**
 * @typedef {object} SignedInRedirectProps
 * @property {string | null} [nextPath]
 */

/**
 * Send a signed-in visitor to an explicit next path, or to today when they have one team.
 *
 * @param {SignedInRedirectProps} props
 */
export function SignedInRedirect({ nextPath }) {
  const [to, setTo] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const path = await resolveSignedInPath(nextPath ?? null);
        if (!cancelled) {
          setTo(path);
        }
      } catch (error) {
        if (!(error instanceof ApiError)) {
          console.error('Failed to resolve signed-in home', error);
        }
        if (!cancelled) {
          setTo('/teams');
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  if (to == null) {
    return (
      <CenteredLayout>
        <LoadingState />
      </CenteredLayout>
    );
  }

  return <Navigate to={to} replace />;
}
