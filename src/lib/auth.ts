import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim() || undefined;

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        correo: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.password) return null;
        try {
          const usuario = await prisma.usuario.findUnique({
            where: { correo: credentials.correo.trim().toLowerCase() },
            include: { cliente: true, administrador: true },
          });

          if (!usuario || usuario.estado !== "ACTIVO") return null;

          const valid = await bcrypt.compare(
            credentials.password,
            usuario.passwordHash
          );
          if (!valid) return null;

          return {
            id: String(usuario.id),
            email: usuario.correo,
            name: `${usuario.nombre} ${usuario.apellidoPaterno}`,
            role: usuario.rol,
            clienteId: usuario.cliente?.id ?? null,
          };
        } catch (error) {
          console.error("[AUTH_AUTHORIZE_ERROR]", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clienteId = user.clienteId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as string;
        session.user.clienteId = token.clienteId as number | null;
      }
      return session;
    },
  },
};
