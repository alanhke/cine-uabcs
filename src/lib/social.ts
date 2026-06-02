export function normalizarParUsuarios(
  usuarioAId: number,
  usuarioBId: number
): { usuarioAId: number; usuarioBId: number } {
  return usuarioAId < usuarioBId
    ? { usuarioAId, usuarioBId }
    : { usuarioAId: usuarioBId, usuarioBId: usuarioAId };
}

export async function sonAmigos(
  prisma: {
    solicitudAmistad: {
      findFirst: (args: {
        where: {
          OR: Array<{
            emisorUsuarioId: number;
            receptorUsuarioId: number;
            estado: "ACEPTADA";
          }>;
        };
      }) => Promise<unknown | null>;
    };
  },
  usuarioId: number,
  otroUsuarioId: number
): Promise<boolean> {
  const amistad = await prisma.solicitudAmistad.findFirst({
    where: {
      OR: [
        {
          emisorUsuarioId: usuarioId,
          receptorUsuarioId: otroUsuarioId,
          estado: "ACEPTADA",
        },
        {
          emisorUsuarioId: otroUsuarioId,
          receptorUsuarioId: usuarioId,
          estado: "ACEPTADA",
        },
      ],
    },
  });
  return Boolean(amistad);
}
