import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  DoorOpen,
  Film,
  LayoutDashboard,
  Popcorn,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AdminLink = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const dashboardLink: AdminLink = {
  href: "/admin/dashboard",
  icon: LayoutDashboard,
  label: "Panel",
};

const moduleLinks: AdminLink[] = [
  { href: "/admin/peliculas", icon: Film, label: "Películas" },
  { href: "/admin/funciones", icon: Calendar, label: "Funciones" },
  { href: "/admin/dulceria", icon: Popcorn, label: "Dulcería" },
  { href: "/admin/salas", icon: DoorOpen, label: "Salas" },
  { href: "/admin/ventas", icon: BarChart3, label: "Ventas" },
];

function DesktopLink({
  href,
  icon: Icon,
  label,
  active = false,
}: AdminLink & { active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-[background-color,color,transform] duration-200 ease-out-quart active:scale-[0.98]",
        active
          ? "bg-primary text-primary-foreground"
          : "text-navy/70 hover:bg-primary/10 hover:text-navy"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200 ease-out-quart group-hover:scale-110",
          active ? "text-primary-foreground" : "text-primary"
        )}
      />
      {label}
    </Link>
  );
}

type AdminDashboardNavigationProps = {
  variant?: "all" | "desktop" | "mobile";
};

export function AdminDashboardNavigation({
  variant = "all",
}: AdminDashboardNavigationProps) {
  return (
    <>
      {variant !== "mobile" && (
        <nav
          aria-label="Navegación administrativa"
          className="hidden lg:block"
        >
          <div className="sticky top-24 w-52 rounded-2xl border border-navy/10 bg-white/80 p-2 shadow-sm">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-navy/40">
              Administración
            </p>
            <div className="space-y-1">
              <DesktopLink {...dashboardLink} active />
              {moduleLinks.map((link) => (
                <DesktopLink key={link.href} {...link} />
              ))}
            </div>
          </div>
        </nav>
      )}

      {variant !== "desktop" && (
        <nav
          aria-label="Accesos rápidos administrativos"
          className="lg:hidden"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/45">
            Accesos rápidos
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {moduleLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="group block transition-transform duration-150 ease-out-quart active:scale-[0.97]"
              >
                <Card className="h-full transition-[transform,box-shadow,background-color] duration-300 ease-out-quart group-hover:-translate-y-1 group-hover:bg-primary/5 group-hover:shadow-matinee">
                  <CardContent className="flex flex-col items-center gap-2 py-5">
                    <Icon className="h-7 w-7 text-primary transition-transform duration-300 ease-out-quart group-hover:scale-110" />
                    <span className="text-sm font-semibold text-navy">{label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
