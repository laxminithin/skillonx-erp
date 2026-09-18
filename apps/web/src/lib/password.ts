/**
 * Client mirror of the server password policy (apps/api/src/utils/password.ts).
 * Keep these rules in sync so the requirements indicator never disagrees with
 * what the API will accept.
 */
export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'uppercase', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'lowercase', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
];

export function isPasswordValid(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}
