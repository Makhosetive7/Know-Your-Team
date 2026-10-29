import styled from 'styled-components';

import { Card } from '@/components/Card';
import { CenteredLayout } from '@/components/CenteredLayout';
import { PageHeader } from '@/components/PageHeader';
import { TextLink } from '@/components/TextLink';

/**
 * Unknown public route.
 */
export function NotFoundPage() {
  return (
    <CenteredLayout>
      <Card>
        <PageHeader title="Not found">
          <Lead>That page is not in this app.</Lead>
        </PageHeader>
        <p>
          <TextLink to="/">Back to Know Your Team</TextLink>
        </p>
      </Card>
    </CenteredLayout>
  );
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
`;
