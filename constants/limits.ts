// Longest allowed text. firestore.rules enforces the same numbers; change both together.
export const MAX_NAME_LENGTH = 100; // Items
export const MAX_AMOUNT_LENGTH = 30;
export const MAX_LIST_NAME_LENGTH = 50;
export const MAX_PERSON_NAME_LENGTH = 50;
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_EMAIL_LENGTH = 254; // The longest address the email standard allows
// Firebase Auth's own minimum; it rejects shorter passwords with auth/weak-password.
export const MIN_PASSWORD_LENGTH = 6;

// How long an invite code works. joinGroup in functions/src/index.ts enforces the same number.
export const INVITE_LIFETIME_DAYS = 7;
