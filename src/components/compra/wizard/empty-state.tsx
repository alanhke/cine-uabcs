import { Ticket } from "lucide-react";

export function EmptyState({
  icon: Icon,
  label,
}: {
  icon: typeof Ticket;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-cream p-4 text-navy/60">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}
