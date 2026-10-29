import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import { ErrorMessage } from '@/components/ErrorMessage';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { ApiError } from '@/services/http';
import { createAdminActivity, listAdminActivities } from '@/services/activity-service';
import { ACTIVITY_CATEGORY, ACTIVITY_CATEGORY_LABEL } from '@/types/activity';

/** @typedef {import('../types/activity').ActivityCategory} ActivityCategory */
/** @typedef {import('../types/activity').AdminActivity} AdminActivity */

const CATEGORY_LABELS = Object.values(ACTIVITY_CATEGORY_LABEL);
const CATEGORY_FROM_LABEL = Object.freeze(
  Object.fromEntries(
    Object.entries(ACTIVITY_CATEGORY_LABEL).map(([value, label]) => [label, value]),
  ),
);

/**
 * Platform administrator view of the shared activity library.
 */
export function AdminActivitiesPage() {
  const [activities, setActivities] = useState(/** @type {AdminActivity[] | null} */ (null));
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState(
    /** @type {ActivityCategory} */ (ACTIVITY_CATEGORY.ICEBREAKER),
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState('5');
  const [errorMessage, setErrorMessage] = useState(/** @type {string | null} */ (null));
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await listAdminActivities();
    setActivities(rows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await load();
        if (!cancelled) {
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setActivities(null);
          setErrorMessage(messageForLoadError(error));
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  /**
   * @param {import('react').FormEvent<HTMLFormElement>} event
   * @returns {Promise<void>}
   */
  async function handleCreate(event) {
    event.preventDefault();
    const minutes = Number(estimatedMinutes);
    if (!Number.isInteger(minutes) || minutes < 1) {
      setErrorMessage('Estimated minutes must be a whole number of at least 1.');
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await createAdminActivity({
        title: title.trim(),
        instructions: instructions.trim(),
        category,
        estimatedMinutes: minutes,
      });
      setTitle('');
      setInstructions('');
      await load();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Could not add the activity.');
    } finally {
      setIsSaving(false);
    }
  }

  if (activities == null && errorMessage) {
    return (
      <section>
        <PageHeader title="Activity library" />
        <ErrorMessage message={errorMessage} />
      </section>
    );
  }

  if (activities == null) {
    return <LoadingState />;
  }

  return (
    <section>
      <PageHeader eyebrow="Platform" title="Activity library">
        <Lead>Activities here can be assigned to any team. Completions stay with the team.</Lead>
      </PageHeader>
      <ErrorMessage message={errorMessage} />
      <Form onSubmit={(event) => void handleCreate(event)}>
        <TextField
          id="activityTitle"
          label="Title"
          value={title}
          required
          onChange={(event) => {
            setTitle(event.target.value);
          }}
        />
        <Field>
          <Label htmlFor="instructions">Instructions</Label>
          <TextArea
            id="instructions"
            value={instructions}
            required
            onChange={(event) => {
              setInstructions(event.target.value);
            }}
          />
        </Field>
        <SelectField
          id="category"
          label="Category"
          value={ACTIVITY_CATEGORY_LABEL[category]}
          options={CATEGORY_LABELS}
          required
          onChange={(event) => {
            const next = CATEGORY_FROM_LABEL[event.target.value];
            if (next) {
              setCategory(/** @type {ActivityCategory} */ (next));
            }
          }}
        />
        <TextField
          id="estimatedMinutes"
          label="Estimated minutes"
          type="number"
          value={estimatedMinutes}
          required
          onChange={(event) => {
            setEstimatedMinutes(event.target.value);
          }}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Adding…' : 'Add activity'}
        </Button>
      </Form>
      <List>
        {activities.map((activity) => (
          <Item key={activity.id}>
            <strong>{activity.title}</strong>
            <Meta>
              {ACTIVITY_CATEGORY_LABEL[activity.category] ?? activity.category}
              {' · '}
              {activity.estimatedMinutes} min
              {' · '}
              {activity.isActive ? 'Active' : 'Inactive'}
            </Meta>
          </Item>
        ))}
      </List>
    </section>
  );
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function messageForLoadError(error) {
  if (error instanceof ApiError && error.status === 403) {
    return 'You need a platform administrator account to manage the activity library.';
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Could not load the activity library.';
}

const Lead = styled.p`
  margin: ${({ theme }) => theme.space.md} 0 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.xl};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
`;

const TextArea = styled.textarea`
  min-height: 6rem;
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.md}`};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};
  font: inherit;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`;

const Item = styled.li`
  padding: ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
`;

const Meta = styled.p`
  margin: ${({ theme }) => theme.space.xs} 0 0;
  color: ${({ theme }) => theme.color.inkMuted};
  font-size: 0.875rem;
`;
