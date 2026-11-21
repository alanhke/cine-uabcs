import { vi, type Mock } from "vitest";

/**
 * Prisma simulado para pruebas: cualquier `prismaMock.<modelo>.<método>` es un
 * vi.fn() creado al vuelo. `$transaction(fn)` ejecuta `fn(prismaMock)`.
 * Uso: vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))
 */
type Modelo = Record<string, Mock>;

const modelos = new Map<string, Modelo>();

function modelo(nombre: string): Modelo {
  let m = modelos.get(nombre);
  if (!m) {
    const fns: Modelo = {};
    m = new Proxy(fns, {
      get(target, metodo: string) {
        if (!(metodo in target)) target[metodo] = vi.fn();
        return target[metodo];
      },
    });
    modelos.set(nombre, m);
  }
  return m;
}

const transaction = vi.fn();
// $queryRaw, $executeRaw, etc.
const metodosCliente = new Map<string, Mock>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prismaMock: any = new Proxy(
  {},
  {
    get(_t, prop: string) {
      if (prop === "$transaction") return transaction;
      if (prop === "then") return undefined;
      if (prop.startsWith("$")) {
        if (!metodosCliente.has(prop)) metodosCliente.set(prop, vi.fn());
        return metodosCliente.get(prop);
      }
      return modelo(prop);
    },
    set(_t, prop: string, valor: Mock) {
      metodosCliente.set(prop, valor);
      return true;
    },
  }
);

function transaccionPorDefecto() {
  transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === "function" ? arg(prismaMock) : Promise.all(arg as unknown[])
  );
}
transaccionPorDefecto();

export function resetPrismaMock() {
  modelos.forEach((m) => Object.values(m).forEach((fn) => fn.mockReset()));
  metodosCliente.forEach((fn) => fn.mockReset());
  transaction.mockReset();
  transaccionPorDefecto();
}
