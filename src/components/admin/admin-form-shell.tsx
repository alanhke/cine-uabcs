import { PageHeaderConVolver } from "@/components/navigation/boton-volver";

export function AdminFormShell({
  backHref,
  backLabel,
  title,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 px-4 py-6 md:max-w-2xl">
      <PageHeaderConVolver href={backHref} label={backLabel} title={title} />
      {children}
    </div>
  );
}
