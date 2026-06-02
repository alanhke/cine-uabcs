"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Film, User, LogOut, Ticket, Users, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMINISTRADOR";

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4 md:max-w-4xl lg:max-w-6xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy text-cream">
            <Film className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-navy">Cine UABCS</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/cartelera"
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-navy hover:bg-primary/10 sm:block"
          >
            Cartelera
          </Link>
          <Link
            href="/dulceria"
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-navy hover:bg-primary/10 md:block"
          >
            Dulcería
          </Link>
          <Link
            href="/estrenos-tmdb"
            className="hidden rounded-xl px-3 py-2 text-sm font-medium text-navy hover:bg-primary/10 lg:block"
          >
            Estrenos
          </Link>
          {session?.user?.role === "CLIENTE" && (
            <>
              <Link href="/perfil" className="hidden rounded-xl px-2 py-2 text-sm text-navy hover:bg-paliacate/30 sm:block">
                Perfil
              </Link>
              <Link href="/historial" className="hidden rounded-xl p-2 text-navy hover:bg-paliacate/30 sm:block">
                <Ticket className="h-5 w-5" />
              </Link>
              <Link href="/social/amigos" className="hidden rounded-xl p-2 text-navy hover:bg-paliacate/30 sm:block">
                <Users className="h-5 w-5" />
              </Link>
              <Link href="/social/chat" className="hidden rounded-xl p-2 text-navy hover:bg-paliacate/30 sm:block">
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="/wrapped"
                title="Tu año en CineUABCS"
                className="hidden rounded-xl p-2 text-navy hover:bg-primary/10 sm:block"
              >
                <Sparkles className="h-5 w-5 animate-pulse text-primary drop-shadow-[0_0_6px_rgba(245,200,66,0.5)]" />
              </Link>
            </>
          )}
          {isAdmin && (
            <Link href="/admin/dashboard" className="rounded-xl px-3 py-2 text-sm font-medium text-navy hover:bg-paliacate/30">
              Admin
            </Link>
          )}
          {session ? (
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button size="sm">
                <User className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
