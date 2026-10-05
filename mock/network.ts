// Makes mock API calls behave like real network requests.

// Simulates network latency so loading states are visible.
export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns a deep copy, like a real API sending JSON. Without this, callers would get
// the same objects back after an update, and React wouldn't notice the change.
export const response = <T>(data: T): T => JSON.parse(JSON.stringify(data));
