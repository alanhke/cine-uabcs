"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { useToast } from "@/components/ui/toast-provider";
import type { ActionResult } from "@/app/actions/admin/peliculas";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Guardando..." : label}
    </Button>
  );
}

export function AdminSubmitForm({
  action,
  redirectTo,
  submitLabel,
  children,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  redirectTo: string;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useFormState(action, null);

  useEffect(() => {
    if (state?.ok) {
      toast("Imagen y cambios guardados con éxito");
      router.push(redirectTo);
      router.refresh();
      return;
    }
    if (state && !state.ok) {
      toast(state.error, "error");
    }
  }, [state, redirectTo, router, toast]);

  return (
    <form action={formAction} className="space-y-4">
      {children}
      <FormError
        message={state && !state.ok ? state.error : undefined}
        variant="navy"
      />
      <SubmitButton label={submitLabel} />
    </form>
  );
}
