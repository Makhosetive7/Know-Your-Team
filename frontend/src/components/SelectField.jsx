import styled from 'styled-components';

/**
 * @typedef {object} SelectFieldProps
 * @property {string} id
 * @property {string} label
 * @property {string} value
 * @property {(event: import('react').ChangeEvent<HTMLSelectElement>) => void} onChange
 * @property {string[]} options
 * @property {boolean} [required]
 */

/**
 * @param {SelectFieldProps} props
 */
export function SelectField({ id, label, value, onChange, options, required }) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} name={id} value={value} onChange={onChange} required={required}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
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

const Select = styled.select`
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
