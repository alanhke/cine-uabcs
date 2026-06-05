"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { getPostLoginRedirect } from "@/lib/access-control";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await signIn("credentials", {
        correo,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Credenciales incorrectas");
        return;
      }
      if (!res || res.ok === false) {
        setError("No se pudo iniciar sesión. Intenta nuevamente.");
        return;
      }
      const session = await getSession();
      const role =
        session?.user?.role === "ADMINISTRADOR" ? "ADMINISTRADOR" : "CLIENTE";
      const callbackUrl = searchParams.get("callbackUrl");
      router.push(getPostLoginRedirect(callbackUrl, role));
      router.refresh();
    } catch (error) {
      console.error("[LOGIN_SUBMIT_ERROR]", error);
      setError("Error de autenticación. Revisa la configuración del servidor.");
    }
  }

  return (
    <div className="px-4 py-8">
      <Card className="mx-auto max-w-md">
        <CardContent className="space-y-5 py-8">
          <CardTitle className="text-center">Iniciar sesión</CardTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
          <p className="text-center text-sm text-navy/60">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/registro" className="font-semibold text-navy underline">
              Regístrate
            </Link>
          </p>
          <p className="text-center text-xs text-navy/40">
            Admin demo: admin@cine.uabcs.edu / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
