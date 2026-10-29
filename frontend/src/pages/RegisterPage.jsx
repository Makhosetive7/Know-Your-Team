import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';

import { Card } from '@/components/Card';
import { CenteredLayout } from '@/components/CenteredLayout';
import { PageHeader } from '@/components/PageHeader';
import { TextLink } from '@/components/TextLink';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { useAuth } from '@/features/auth/use-auth';
import { guestHref } from '@/lib/safe-next-path';
import { resolveSignedInPath } from '@/lib/signed-in-home';
import { ApiError } from '@/services/http';

/**
 * Public registration screen.
 */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedNext = searchParams.get('next');
  const next = requestedNext;
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @param {string} params.displayName
   * @returns {Promise<void>}
   */
  async function handleSubmit({ email, password, displayName }) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await register({ email, password, displayName });
      navigate(await resolveSignedInPath(requestedNext), { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not create the account. Try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CenteredLayout>
      <Card>
        <PageHeader eyebrow="Join your team" title="Create an account">
          <Lead>One short activity a day. Skip whenever you need to.</Lead>
        </PageHeader>
        <RegisterForm
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
        <Footer>
          Already have an account? <TextLink to={guestHref('/sign-in', next)}>Sign in</TextLink>
        </Footer>
      </Card>
    </CenteredLayout>
  );
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
`;

const Footer = styled.p`
  margin: ${({ theme }) => theme.space.lg} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;
