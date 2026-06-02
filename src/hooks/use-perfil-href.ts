"use client";

import { useSession } from "next-auth/react";
import { getPerfilHref } from "@/lib/perfil-link";

export function useCurrentUserId(): number | null {
  const { data: session } = useSession();
  if (!session?.user?.id) return null;
  return parseInt(session.user.id, 10);
}

export function usePerfilHref(targetUserId: number): string {
  const currentUserId = useCurrentUserId();
  return getPerfilHref(targetUserId, currentUserId);
}
