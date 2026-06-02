import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    clienteId: number | null;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      clienteId: number | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    clienteId?: number | null;
  }
}
