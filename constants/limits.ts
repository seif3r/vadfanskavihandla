// Longest allowed text. firestore.rules enforces the same numbers; change both together.
export const MAX_NAME_LENGTH = 100; // Items
export const MAX_AMOUNT_LENGTH = 30;
export const MAX_LIST_NAME_LENGTH = 50;
export const MAX_PERSON_NAME_LENGTH = 50;
export const MAX_GROUP_NAME_LENGTH = 50;
export const MAX_EMAIL_LENGTH = 254; // The longest address the email standard allows
// Firebase Auth's own minimum; it rejects shorter passwords with auth/weak-password.
export const MIN_PASSWORD_LENGTH = 6;

// A person's changes to a list are collected until they've been quiet this long, then notified
// as one. DELAY_SECONDS in functions/src/index.ts (push) is the same number.
export const NOTIFICATION_DELAY_SECONDS = 60;

// How long a two-tap button (ConfirmButton) waits for the second tap. Longer with a screen reader,
// which needs time to read the new label out before the person can tap again.
export const CONFIRM_TIMEOUT_MS = 3000;
export const CONFIRM_TIMEOUT_SCREEN_READER_MS = 6000;

// How long an invite code works. joinGroup in functions/src/index.ts enforces the same number.
export const INVITE_LIFETIME_DAYS = 7;
