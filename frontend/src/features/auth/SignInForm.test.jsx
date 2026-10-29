import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '@/test/render-with-theme';

import { SignInForm } from './SignInForm';

describe('SignInForm', () => {
  it('submits email and password', () => {
    const onSubmit = vi.fn();
    renderWithTheme(<SignInForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password1',
    });
  });

  it('shows a server error and a busy submit label', () => {
    renderWithTheme(
      <SignInForm errorMessage="Incorrect email or password." isSubmitting onSubmit={vi.fn()} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled();
  });
});
