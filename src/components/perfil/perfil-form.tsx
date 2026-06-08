"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { useToast } from "@/components/ui/toast-provider";
import { actualizarPerfil } from "@/app/actions/perfil";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Guardando..." : "Guardar cambios"}
    </Button>
  );
}

export function PerfilForm() {
  const { toast } = useToast();
  const [state, formAction] = useFormState(actualizarPerfil, null);
  const [loaded, setLoaded] = useState(false);
  const [defaults, setDefaults] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    avatarUrl: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((d) => {
        setDefaults({
          nombre: d.nombre ?? "",
          apellidoPaterno: d.apellidoPaterno ?? "",
          apellidoMaterno: d.apellidoMaterno ?? "",
          telefono: d.telefono ?? "",
          avatarUrl: d.avatarUrl ?? "",
        });
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (state?.ok) {
      setMsg("Perfil actualizado");
      toast("Perfil guardado con éxito");
      return;
    }
    if (state && !state.ok) {
      setMsg("");
      toast(state.error, "error");
    }
  }, [state, toast]);

  if (!loaded) {
    return <p className="text-sm text-navy/50">Cargando datos...</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <ImageUploadField
        label="Foto de perfil"
        pathFieldName="avatarUrl"
        fileFieldName="avatarFile"
        prefix="avatar"
        currentPath={defaults.avatarUrl}
        variant="avatar"
      />

      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input name="nombre" defaultValue={defaults.nombre} required />
      </div>
      <div className="space-y-1">
        <Label>Apellido paterno</Label>
        <Input name="apellidoPaterno" defaultValue={defaults.apellidoPaterno} required />
      </div>
      <div className="space-y-1">
        <Label>Apellido materno</Label>
        <Input name="apellidoMaterno" defaultValue={defaults.apellidoMaterno} />
      </div>
      <div className="space-y-1">
        <Label>Teléfono (10 dígitos)</Label>
        <Input
          name="telefono"
          inputMode="numeric"
          maxLength={10}
          defaultValue={defaults.telefono}
          required
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
          }}
        />
      </div>

      <FormError
        message={state && !state.ok ? state.error : undefined}
        variant="navy"
      />
      {msg && <p className="text-sm font-medium text-navy">{msg}</p>}
      <SubmitButton />
    </form>
  );
}
