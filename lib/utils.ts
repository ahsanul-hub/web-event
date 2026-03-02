export function generateRegistrationCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PATKLIN-${new Date().getFullYear()}-${random}`;
}
