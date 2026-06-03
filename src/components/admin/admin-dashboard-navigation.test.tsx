import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdminDashboardNavigation } from "@/components/admin/admin-dashboard-navigation";

afterEach(cleanup);

describe("AdminDashboardNavigation", () => {
  it("muestra navegación persistente en escritorio y accesos rápidos en móvil", () => {
    render(<AdminDashboardNavigation />);

    const desktopNav = screen.getByRole("navigation", {
      name: "Navegación administrativa",
    });
    const mobileNav = screen.getByRole("navigation", {
      name: "Accesos rápidos administrativos",
    });

    expect(desktopNav).toHaveClass("hidden", "lg:block");
    expect(mobileNav).toHaveClass("lg:hidden");

    const panel = within(desktopNav).getByRole("link", { name: "Panel" });
    expect(panel).toHaveAttribute("href", "/admin/dashboard");
    expect(panel).toHaveAttribute("aria-current", "page");

    const rutas = [
      ["Películas", "/admin/peliculas"],
      ["Funciones", "/admin/funciones"],
      ["Dulcería", "/admin/dulceria"],
      ["Salas", "/admin/salas"],
      ["Ventas", "/admin/ventas"],
    ];

    for (const [label, href] of rutas) {
      expect(within(desktopNav).getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href
      );
      expect(within(mobileNav).getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href
      );
    }
  });
});
