"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { registroSchema, type RegistroInput } from "@/lib/validations/schemas";

export default function RegistroPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistroInput>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      correo: "",
      password: "",
      telefono: "",
    },
  });

  async function onSubmit(data: RegistroInput) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setError("root", { message: json.error ?? "Error al registrar" });
      return;
    }
    router.push("/auth/login");
  }

  return (
    <div className="px-4 py-8">
      <Card className="mx-auto max-w-md">
        <CardContent className="space-y-5 py-8">
          <CardTitle className="text-center">Crear cuenta</CardTitle>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input {...register("nombre")} />
              <FormError message={errors.nombre?.message} />
            </div>
            <div className="space-y-1">
              <Label>Apellido paterno</Label>
              <Input {...register("apellidoPaterno")} />
              <FormError message={errors.apellidoPaterno?.message} />
            </div>
            <div className="space-y-1">
              <Label>Apellido materno (opcional)</Label>
              <Input {...register("apellidoMaterno")} />
            </div>
            <div className="space-y-1">
              <Label>Correo</Label>
              <Input type="email" {...register("correo")} />
              <FormError message={errors.correo?.message} variant="navy" />
            </div>
            <div className="space-y-1">
              <Label>Teléfono (10 dígitos, opcional)</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                {...register("telefono", {
                  setValueAs: (v) => String(v ?? "").replace(/\D/g, "").slice(0, 10),
                })}
              />
              <FormError message={errors.telefono?.message} />
            </div>
            <div className="space-y-1">
              <Label>Contraseña</Label>
              <Input type="password" {...register("password")} />
              <FormError message={errors.password?.message} />
            </div>
            <FormError message={errors.root?.message} variant="navy" />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrarme"}
            </Button>
          </form>
          <p className="text-center text-sm">
            <Link href="/auth/login" className="text-navy underline">
              Ya tengo cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
