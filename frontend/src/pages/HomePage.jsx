import { useNavigate } from 'react-router';
import styled, { css } from 'styled-components';

import { BrandLockup } from '@/components/BrandLockup';
import { Button, BUTTON_VARIANT } from '@/components/Button';
import { CenteredLayout } from '@/components/CenteredLayout';
import { LoadingState } from '@/components/LoadingState';
import { TextLink } from '@/components/TextLink';
import { SignedInRedirect } from '@/features/auth/SignedInRedirect';
import { useAuth } from '@/features/auth/use-auth';

/**
 * Public landing. Signed-in visitors go to their teams.
 */
export function HomePage() {
  const { status } = useAuth();
  const navigate = useNavigate();

  if (status === 'loading') {
    return (
      <CenteredLayout>
        <LoadingState />
      </CenteredLayout>
    );
  }

  if (status === 'authenticated') {
    return <SignedInRedirect />;
  }

  return (
    <Page>
      <TopBar>
        <BrandLockup />
        <TextLink to="/sign-in">Sign in</TextLink>
      </TopBar>
      <Main>
        <Hero>
          <Copy>
            <Eyebrow>A daily team ritual</Eyebrow>
            <Title>One small activity. The whole team.</Title>
            <Lead>The same prompt, the same day. Sit with it, or skip it. Nobody is ranked.</Lead>
            <Actions>
              <Button onClick={() => navigate('/register')}>Create an account</Button>
              <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => navigate('/join')}>
                Join with an invite
              </Button>
            </Actions>
          </Copy>
          <Preview aria-label="Example of today's activity">
            <PreviewMeta>
              <span>Today</span>
              <span>Icebreaker · 3 min</span>
            </PreviewMeta>
            <PreviewTitle>Two truths</PreviewTitle>
            <PreviewBody>
              Share two true things and one invention. Everyone else guesses the invention. Keep it
              light.
            </PreviewBody>
            <PreviewActions aria-hidden="true">
              <FakePrimary>Mark complete</FakePrimary>
              <FakeSecondary>Skip</FakeSecondary>
            </PreviewActions>
          </Preview>
        </Hero>

        <Section>
          <SectionTitle>How a team shares the day</SectionTitle>
          <Steps>
            <li>
              <StepIndex>01</StepIndex>
              <div>
                <StepTitle>Start a team</StepTitle>
                <p>Name the workspace. The team timezone decides which day it is.</p>
              </div>
            </li>
            <li>
              <StepIndex>02</StepIndex>
              <div>
                <StepTitle>Share one invite</StepTitle>
                <p>
                  The person who runs the team sends one invite link. You land on today&apos;s
                  prompt, not a control panel.
                </p>
              </div>
            </li>
            <li>
              <StepIndex>03</StepIndex>
              <div>
                <StepTitle>Meet on today&apos;s prompt</StepTitle>
                <p>Complete it or skip it. The team only sees a count, never a leaderboard.</p>
              </div>
            </li>
          </Steps>
        </Section>

        <Section>
          <SectionTitle>Built for connection, not monitoring</SectionTitle>
          <Promises>
            <PromiseCard>
              <StepTitle>Same activity for everyone</StepTitle>
              <p>
                Assignment comes from the team&apos;s day, not from a manager picking favourites.
              </p>
            </PromiseCard>
            <PromiseCard>
              <StepTitle>Skip without penalty</StepTitle>
              <p>Leaving today empty is allowed. Completing is not consent to share an answer.</p>
            </PromiseCard>
            <PromiseCard>
              <StepTitle>Progress stays with the team</StepTitle>
              <p>How many people showed up. No individual ranking, no HR score.</p>
            </PromiseCard>
          </Promises>
        </Section>
      </Main>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
`;

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => `${theme.space.md} ${theme.space.lg}`};
`;

const Main = styled.main`
  max-width: 64rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space.xl} ${theme.space.lg} 4rem`};
`;

const Hero = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.xl};
  align-items: center;

  @media (min-width: 880px) {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
`;

const Copy = styled.div``;

const Eyebrow = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.sm};
  color: ${({ theme }) => theme.color.accent};
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2.25rem, 5vw, 3.4rem);
  letter-spacing: -0.03em;
  line-height: 1.05;
`;

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.lg} 0;
  color: ${({ theme }) => theme.color.inkMuted};
  font-family: ${({ theme }) => theme.font.display};
  font-size: 1.25rem;
  font-style: italic;
  font-weight: 500;
  line-height: 1.4;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  max-width: 22rem;
`;

const Preview = styled.article`
  padding: ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow};
  transform: rotate(-1.25deg);

  @media (max-width: 879px) {
    transform: none;
  }
`;

const PreviewMeta = styled.p`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin: 0 0 ${({ theme }) => theme.space.md};
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
  font-weight: 600;
`;

const PreviewTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: 2rem;
`;

const PreviewBody = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  color: ${({ theme }) => theme.color.inkMuted};
`;

const PreviewActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const fakeButton = css`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  font-weight: 600;
`;

const FakePrimary = styled.span`
  ${fakeButton}
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.accent};
  color: ${({ theme }) => theme.color.surface};
`;

const FakeSecondary = styled.span`
  ${fakeButton}
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};
`;

const Section = styled.section`
  margin-top: 4rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.lg};
  font-size: 1.75rem;
`;

const Steps = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${({ theme }) => theme.space.lg};

  @media (min-width: 880px) {
    grid-template-columns: repeat(3, 1fr);
  }

  li {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space.sm};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.color.inkMuted};
  }
`;

const StepIndex = styled.span`
  color: ${({ theme }) => theme.color.accent};
  font-family: ${({ theme }) => theme.font.display};
  font-size: 1.125rem;
  font-style: italic;
`;

const StepTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space.xs};
  font-size: 1.125rem;
`;

const Promises = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.md};

  @media (min-width: 880px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PromiseCard = styled.article`
  padding: ${({ theme }) => theme.space.lg};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.color.surface};

  p {
    margin: 0;
    color: ${({ theme }) => theme.color.inkMuted};
  }
`;
