"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePerfilHref } from "@/hooks/use-perfil-href";

type UserLinkProps = {
  userId: number;
  children: React.ReactNode;
  className?: string;
  /** Si true, solo cambia color al hover sin subrayado */
  subtle?: boolean;
};

export function UserLink({
  userId,
  children,
  className,
  subtle = false,
}: UserLinkProps) {
  const href = usePerfilHref(userId);

  return (
    <Link
      href={href}
      className={cn(
        "font-semibold text-navy transition-colors hover:text-primary",
        !subtle && "hover:underline",
        className
      )}
    >
      {children}
    </Link>
  );
}
