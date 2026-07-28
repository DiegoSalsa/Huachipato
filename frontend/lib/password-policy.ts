export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_REQUIREMENTS =
  "Usa al menos 8 caracteres, con una mayúscula, una minúscula y un número.";

export function getPasswordError(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra minúscula.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula.";
  }
  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }
  return null;
}
