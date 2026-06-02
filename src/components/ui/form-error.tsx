import { cn } from "@/lib/utils";

interface FormErrorProps {
  message?: string;
  variant?: "navy" | "paliacate";
}

export function FormError({ message, variant = "paliacate" }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "text-sm font-medium",
        variant === "navy" ? "text-navy" : "text-navy bg-paliacate/40 rounded-xl px-3 py-1.5"
      )}
      role="alert"
    >
      {message}
    </p>
  );
}
