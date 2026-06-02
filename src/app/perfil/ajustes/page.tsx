"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Copy, CreditCard, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PerfilForm } from "@/components/perfil/perfil-form";

export default function PerfilAjustesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [codigoAmigo, setCodigoAmigo] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?callbackUrl=/perfil/ajustes");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((d) => {
        if (d.correo) setCorreo(d.correo);
        if (d.codigoAmigo) setCodigoAmigo(d.codigoAmigo);
      });
  }, []);

  function copiarCodigo() {
    if (codigoAmigo) {
      navigator.clipboard.writeText(codigoAmigo);
      setMsg("Código copiado");
    }
  }

  if (status === "loading") {
    return <p className="p-8 text-center text-navy/60">Cargando...</p>;
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Link
          href="/perfil"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          aria-label="Volver al perfil"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Ajustes</h1>
          <p className="text-sm text-navy/60">Configuración de tu cuenta</p>
        </div>
      </div>

      {codigoAmigo && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-cream">
          <CardContent className="py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy/70">
              Tu código de amigo
            </p>
            <p className="font-display mt-2 text-2xl font-bold text-primary">
              {codigoAmigo}
            </p>
            <Button variant="outline" size="sm" className="mt-3 border-primary/30" onClick={copiarCodigo}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar código
            </Button>
            {msg && <p className="mt-2 text-xs text-navy/60">{msg}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="border-navy/10 shadow-sm">
        <CardContent className="space-y-4 py-6">
          <CardTitle className="font-display text-base text-navy">
            Datos personales
          </CardTitle>
          <PerfilForm />
        </CardContent>
      </Card>

      <Card className="border-navy/10 shadow-sm">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-base text-navy">Correo</CardTitle>
          </div>
          <div className="space-y-1">
            <Label>Correo institucional</Label>
            <Input value={correo || session?.user?.email || ""} readOnly disabled />
          </div>
          <p className="text-xs text-navy/55">
            El correo no se puede cambiar desde la app. Contacta al administrador si
            necesitas actualizarlo.
          </p>
        </CardContent>
      </Card>

      <Card className="border-navy/10 shadow-sm">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-base text-navy">Contraseña</CardTitle>
          </div>
          <p className="text-sm text-navy/65">
            El cambio de contraseña estará disponible próximamente.
          </p>
          <Button variant="outline" disabled className="w-full border-navy/15">
            Cambiar contraseña
          </Button>
        </CardContent>
      </Card>

      <Card className="border-navy/10 shadow-sm">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-base text-navy">
              Métodos de pago
            </CardTitle>
          </div>
          <p className="text-sm text-navy/65">
            CineUABCS usa un <strong>pago simulado</strong>.
          </p>
          <Button variant="outline" disabled className="w-full border-navy/15">
            Gestionar métodos de pago
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
