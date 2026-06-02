"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLikeResena } from "@/app/actions/resenas";
import { useToast } from "@/components/ui/toast-provider";

export function ResenaLikeButton({
  resenaId,
  initialCount,
  initialLiked,
}: {
  resenaId: number;
  initialCount: number;
  initialLiked: boolean;
}) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  if (!session) return null;

  async function handleToggle() {
    setPending(true);
    const result = await toggleLikeResena(resenaId);
    setPending(false);
    if (result.ok) {
      setLiked(result.liked);
      setCount(result.likesCount);
    } else {
      toast(result.error, "error");
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleToggle}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        liked
          ? "bg-primary/10 text-primary"
          : "text-navy/55 hover:bg-navy/5 hover:text-primary"
      )}
      aria-pressed={liked}
      aria-label={liked ? "Quitar me gusta" : "Marcar como útil"}
    >
      <ThumbsUp
        className={cn("h-3.5 w-3.5", liked && "fill-primary")}
        aria-hidden
      />
      Útil · {count}
    </button>
  );
}
