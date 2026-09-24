/**
 * Helper para verificar variables de entorno en tests de integración.
 * Nunca imprime el valor real, solo el nombre de la variable faltante.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Add it to .env.local.`);
  }
  return value;
}
