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
      ticketsSold: analytics.boletosVendidos,
      roomOccupancyPercent: analytics.ocupacion.porcentajeGlobal,
      lowStockCount: analytics.inventario.stockBajo.length,
      preferredRoomFormat: preferredSlot?.franja ?? "Sin datos",
      preferredRoomOccupancyPercent:
        preferredSlot?.porcentaje ?? analytics.ocupacion.porcentajeGlobal,
      topMovies: analytics.porPelicula.slice(0, 5).map((pelicula) => ({
        label: pelicula.titulo,
        value: Math.round(pelicula.ingresos),
        detail: `${pelicula.boletos} boleto(s)`,
      })),
      topProducts: analytics.productosTop.map((producto) => ({
        label: producto.nombre,
        value: producto.cantidad,
        detail: "unidades vendidas",
      })),
      salesSeries: analytics.ventasSerie.slice(-7).map((point) => ({
        label: point.label,
        value: Math.round(point.ingresos),
        detail: `${point.boletos} boleto(s) · $${Math.round(point.dulceria)} dulceria`,
      })),
    });
  } catch (error) {
    return handleMobileError(error);
  }
}
