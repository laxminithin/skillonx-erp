/**
 * Shared password policy. The same rules are enforced server-side here and
 * mirrored in the web client so the requirements indicator never disagrees
 * with what the API accepts.
 */
export declare const PASSWORD_MIN_LENGTH = 8;
export type PasswordRule = {
    id: string;
    label: string;
    test: (value: string) => boolean;
};
export declare const PASSWORD_RULES: PasswordRule[];
/**
 * Returns a human-readable error message for the first unmet rule, or null when
 * the password satisfies the whole policy.
 */
export declare function getPasswordError(value: string): string | null;
export declare function isPasswordValid(value: string): boolean;
