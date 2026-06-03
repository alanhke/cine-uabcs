"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Film, Ticket, Users, MessageCircle, Sparkles, Popcorn } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  icon: typeof Film;
  label: string;
  pulse?: boolean;
};

const publicItems: NavItem[] = [
  { href: "/", icon: Film, label: "Inicio" },
  { href: "/cartelera", icon: Film, label: "Cartelera" },
  { href: "/dulceria", icon: Popcorn, label: "Dulcería" },
  { href: "/estrenos-tmdb", icon: Sparkles, label: "Estrenos" },
];

const clientItems: NavItem[] = [
  { href: "/perfil", icon: Users, label: "Perfil" },
  { href: "/historial", icon: Ticket, label: "Boletos" },
  { href: "/wrapped", icon: Sparkles, label: "Wrapped", pulse: true },
  { href: "/social/amigos", icon: Users, label: "Amigos" },
  { href: "/social/chat", icon: MessageCircle, label: "Chat" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // La barra inferior se limita a 5 íconos para que quepan sin desbordarse
  // en cualquier teléfono. Wrapped, Amigos y Chat quedan accesibles desde
  // la página de Perfil.
  const items =
    session?.user?.role === "CLIENTE"
      ? [...publicItems.slice(0, 3), ...clientItems.slice(0, 2)]
      : publicItems;

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-navy/10 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {items.map(({ href, icon: Icon, label, pulse }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-xs font-medium transition-[transform,background-color,color] duration-200 ease-out-quart active:scale-95",
                active
                  ? "bg-primary text-primary-foreground shadow-cta"
                  : "text-navy/70 hover:text-navy"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  pulse &&
                    !active &&
                    "animate-pulse text-primary drop-shadow-[0_0_4px_rgba(245,200,66,0.45)]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
