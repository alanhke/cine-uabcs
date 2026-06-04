import { obtenerAnalyticsAdmin } from "@/services/analytics";
import { handleMobileError, requireMobileAdmin } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireMobileAdmin(req);
    const analytics = await obtenerAnalyticsAdmin("7dias");
    const preferredSlot = analytics.ocupacion.porFranja
      .slice()
      .sort((a, b) => b.porcentaje - a.porcentaje)[0];

    return Response.json({
      averagePurchase: Math.round(analytics.ticketPromedio),
      ticketSales: Math.round(analytics.ingresosBoletos),
      concessionSales: Math.round(analytics.ingresosDulceria),
      transactions: analytics.totalCompras,
      preferredRoomFormat: preferredSlot?.franja ?? "Sin datos",
      preferredRoomOccupancyPercent:
        preferredSlot?.porcentaje ?? analytics.ocupacion.porcentajeGlobal,
    });
  } catch (error) {
    return handleMobileError(error);
  }
}
