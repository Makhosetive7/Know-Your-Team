import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '@/test/render-with-theme';

import { RegisterForm } from './RegisterForm';

describe('RegisterForm', () => {
  it('submits registration fields', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<RegisterForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password1',
      displayName: 'Ada',
    });
  });
});
