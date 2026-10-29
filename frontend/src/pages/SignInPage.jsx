import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';

import { Card } from '@/components/Card';
import { CenteredLayout } from '@/components/CenteredLayout';
import { PageHeader } from '@/components/PageHeader';
import { TextLink } from '@/components/TextLink';
import { SignInForm } from '@/features/auth/SignInForm';
import { useAuth } from '@/features/auth/use-auth';
import { guestHref } from '@/lib/safe-next-path';
import { resolveSignedInPath } from '@/lib/signed-in-home';
import { ApiError } from '@/services/http';

/**
 * Public sign-in screen.
 */
export function SignInPage() {
  const { signIn } = useAuth();
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
   * @returns {Promise<void>}
   */
  async function handleSubmit({ email, password }) {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signIn({ email, password });
      navigate(await resolveSignedInPath(requestedNext), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Sign-in failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CenteredLayout>
      <Card>
        <PageHeader eyebrow="Welcome back" title="Sign in">
          <Lead>Come back to today&apos;s prompt.</Lead>
        </PageHeader>
        <SignInForm
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
        <Footer>
          New here? <TextLink to={guestHref('/register', next)}>Create an account</TextLink>
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
