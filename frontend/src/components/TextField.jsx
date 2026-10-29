import styled from 'styled-components';

/**
 * @typedef {object} TextFieldProps
 * @property {string} id
 * @property {string} label
 * @property {string} value
 * @property {(event: import('react').ChangeEvent<HTMLInputElement>) => void} onChange
 * @property {string} [type]
 * @property {string} [autoComplete]
 * @property {boolean} [required]
 */

/**
 * @param {TextFieldProps} props
 */
export function TextField({ id, label, value, onChange, type = 'text', autoComplete, required }) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
      />
    </Field>
  );
}

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
`;

const Input = styled.input`
  min-height: 2.75rem;
  padding: ${({ theme }) => `${theme.space.sm} ${theme.space.md}`};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.surface};
  color: ${({ theme }) => theme.color.ink};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.color.accent};
    outline-offset: 2px;
  }
`;
