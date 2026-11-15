// Empty is allowed (optional field); otherwise a loose shape check.
// Keep in sync with isValidEmail in server/routes/applications.js.
export const isValidEmail = (val: string) =>
  val.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
