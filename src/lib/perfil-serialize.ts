import type { PerfilPublicoData } from "@/lib/perfil-publico";
import type { PerfilPublicoViewData } from "@/components/perfil/perfil-publico-view";

export function serializePerfilPublico(
  perfil: PerfilPublicoData
): PerfilPublicoViewData {
  return {
    usuario: {
      ...perfil.usuario,
      createdAt: perfil.usuario.createdAt.toISOString(),
    },
    favoritos: perfil.favoritos,
    actividad: perfil.actividad.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    relacion: perfil.relacion,
    esPropio: perfil.esPropio,
    estadisticas: perfil.estadisticas,
    codigoAmigo: perfil.codigoAmigo,
  };
}
