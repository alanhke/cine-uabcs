"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
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
  const [state, formAction] = useFormState(action, null);

  useEffect(() => {
    if (state?.ok) {
      router.push(redirectTo);
      router.refresh();
    }
  }, [state, redirectTo, router]);

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
