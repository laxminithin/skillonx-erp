/**
 * Shared password policy. The same rules are enforced server-side here and
 * mirrored in the web client so the requirements indicator never disagrees
 * with what the API accepts.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RULES = [
    {
        id: 'length',
        label: `At least ${PASSWORD_MIN_LENGTH} characters`,
        test: (v) => v.length >= PASSWORD_MIN_LENGTH,
    },
    { id: 'uppercase', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
    { id: 'lowercase', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
    { id: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
];
/**
 * Returns a human-readable error message for the first unmet rule, or null when
 * the password satisfies the whole policy.
 */
export function getPasswordError(value) {
    if (value.length < PASSWORD_MIN_LENGTH) {
        return `Your new password must contain at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!/[A-Z]/.test(value)) {
        return 'Your new password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(value)) {
        return 'Your new password must contain at least one lowercase letter.';
    }
    if (!/[0-9]/.test(value)) {
        return 'Your new password must contain at least one number.';
    }
    return null;
}
export function isPasswordValid(value) {
    return getPasswordError(value) === null;
}
