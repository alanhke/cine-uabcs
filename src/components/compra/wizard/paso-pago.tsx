"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompraWizardCtx } from "./use-compra-wizard";
import { MetodosGuardados } from "@/components/compra/metodos-guardados";
import { CampoVencimiento } from "@/components/compra/campo-vencimiento";

/** Paso 4: datos del comprador y pago. */
export function PasoPago({ w }: { w: CompraWizardCtx }) {
  const { session, savedMethods, selectedSavedMethodId, setSelectedSavedMethodId,
    guardarMetodoPago, setGuardarMetodoPago, checkout, setCheckout, isSubmitting, goToStep,
    selectSavedMethod, submitPurchase } = w;
  return (
    <Card className="border-navy/10 bg-white text-navy shadow-matinee">
      <CardContent className="space-y-4 py-5">
        {!session && (
          <label className="flex items-center gap-2 text-sm text-navy/70">
            <input
              type="checkbox"
              checked={checkout.esInvitado ?? true}
              onChange={(event) =>
                setCheckout((prev) => ({ ...prev, esInvitado: event.target.checked }))
              }
            />
            Comprar como invitado
          </label>
        )}
        <div className="space-y-2">
          <Label htmlFor="paso-pago-nombre-completo">Nombre completo</Label>
          <Input
            id="paso-pago-nombre-completo"
            value={checkout.nombreComprador}
            onChange={(event) =>
              setCheckout((prev) => ({ ...prev, nombreComprador: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paso-pago-correo">Correo</Label>
          <Input
            id="paso-pago-correo"
            value={checkout.correoComprador}
            onChange={(event) =>
              setCheckout((prev) => ({ ...prev, correoComprador: event.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paso-pago-telefono">Teléfono</Label>
          <Input
            id="paso-pago-telefono"
            value={checkout.telefonoComprador}
            onChange={(event) =>
              setCheckout((prev) => ({
                ...prev,
                telefonoComprador: event.target.value.replace(/\D/g, "").slice(0, 10),
              }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={checkout.metodoPago === "tarjeta" ? "default" : "outline"}
            onClick={() => {
              setSelectedSavedMethodId(null);
              setCheckout((prev) => ({ ...prev, metodoPago: "tarjeta" }));
            }}
          >
            Tarjeta
          </Button>
          <Button
            type="button"
            variant={checkout.metodoPago === "paypal" ? "default" : "outline"}
            onClick={() => {
              setSelectedSavedMethodId(null);
              setCheckout((prev) => ({ ...prev, metodoPago: "paypal" }));
            }}
          >
            PayPal
          </Button>
        </div>

        <MetodosGuardados
          metodos={savedMethods}
          metodoPago={checkout.metodoPago}
          seleccionadoId={selectedSavedMethodId}
          onSeleccionar={selectSavedMethod}
        />

        {checkout.metodoPago === "tarjeta" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paso-pago-numero-de-tarjeta">Número de tarjeta</Label>
              <Input
                id="paso-pago-numero-de-tarjeta"
                value={checkout.numeroTarjeta}
                onChange={(event) =>
                  setCheckout((prev) => ({
                    ...prev,
                    numeroTarjeta: event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 19)
                      .replace(/(.{4})/g, "$1 ")
                      .trim(),
                  }))
                }
              />
              {selectedSavedMethodId ? (
                <p className="text-xs text-navy/70">
                  Puedes dejar la misma referencia de tu tarjeta guardada o capturar otra para esta compra.
                </p>
              ) : null}
            </div>
            <CampoVencimiento
              id="paso-pago-vencimiento"
              value={checkout.vencimientoTarjeta}
              onValueChange={(vencimientoTarjeta) =>
                setCheckout((prev) => ({ ...prev, vencimientoTarjeta }))
              }
            />
            <div className="space-y-2">
              <Label htmlFor="paso-pago-cvv">CVV</Label>
              <Input
                id="paso-pago-cvv"
                value={checkout.cvvTarjeta}
                onChange={(event) =>
                  setCheckout((prev) => ({
                    ...prev,
                    cvvTarjeta: event.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paso-pago-titular">Titular</Label>
              <Input
                id="paso-pago-titular"
                value={checkout.titularTarjeta}
                onChange={(event) =>
                  setCheckout((prev) => ({ ...prev, titularTarjeta: event.target.value }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="paso-pago-correo-de-paypal">Correo de PayPal</Label>
              <Input
                id="paso-pago-correo-de-paypal"
                value={checkout.paypalCorreo}
                onChange={(event) =>
                  setCheckout((prev) => ({ ...prev, paypalCorreo: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paso-pago-contrasena-de-paypal">Contraseña de PayPal</Label>
              <Input
                id="paso-pago-contrasena-de-paypal"
                type="password"
                value={checkout.paypalPassword}
                onChange={(event) =>
                  setCheckout((prev) => ({
                    ...prev,
                    paypalPassword: event.target.value,
                  }))
                }
              />
              {selectedSavedMethodId ? (
                <p className="text-xs text-navy/70">
                  El correo se recuperó de tu método guardado. La contraseña simulada se captura en cada compra.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {session?.user?.clienteId ? (
          <label className="flex items-start gap-2 rounded-2xl border border-navy/10 bg-cream px-3 py-3 text-sm text-navy/70">
            <input
              type="checkbox"
              checked={guardarMetodoPago}
              onChange={(event) => setGuardarMetodoPago(event.target.checked)}
              className="mt-1"
            />
            <span>Guardar método de pago para futuras operaciones</span>
          </label>
        ) : null}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => goToStep("alimentos")}>
            Volver a alimentos
          </Button>
          <Button className="flex-1" disabled={isSubmitting} onClick={submitPurchase}>
            {isSubmitting ? "Procesando..." : "Pagar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
