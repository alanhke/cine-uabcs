// Sin 0/O ni 1/I/L para que el folio se pueda dictar y copiar sin errores.
const ALFABETO_FOLIO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const LARGO_ALEATORIO_FOLIO = 10;

/**
 * M4: el folio da acceso a la compra (M1), así que debe ser impredecible.
 * Antes: fecha en base 36 + 4 caracteres de Math.random (adivinable).
 * Ahora: 10 caracteres de crypto (31^10 ≈ 8.2 × 10^14 combinaciones).
 * Formato: CU-XXXXX-XXXXX. Los folios existentes siguen siendo válidos.
 */
export function generarFolio(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(LARGO_ALEATORIO_FOLIO));
  const chars = Array.from(bytes, (n) => ALFABETO_FOLIO[n % ALFABETO_FOLIO.length]);
  return `CU-${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
}

export function generarCodigoQR(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}
