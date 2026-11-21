import { describe, expect, it } from "vitest";
import {
  getLoginRedirect,
  getProtectedRouteRedirect,
  getPostLoginRedirect,
  isProtectedPath,
} from "@/lib/access-control";

describe("getProtectedRouteRedirect", () => {
  it("envia al login a usuarios sin sesion en rutas protegidas", () => {
    expect(getProtectedRouteRedirect("/perfil", undefined)).toBe(
      "/auth/login?callbackUrl=%2Fperfil"
    );
  });

  it("redirige a admin autenticado lejos de rutas exclusivas de cliente", () => {
    expect(getProtectedRouteRedirect("/perfil", "ADMINISTRADOR")).toBe("/admin/dashboard");
  });

  it("redirige a cliente autenticado lejos de rutas exclusivas de admin", () => {
    expect(getProtectedRouteRedirect("/admin/ventas", "CLIENTE")).toBe("/");
  });

  it("permite a cliente autenticado entrar a sus rutas", () => {
    expect(getProtectedRouteRedirect("/social/chat", "CLIENTE")).toBeNull();
  });
});

describe("login redirects", () => {
  it("genera callbackUrl para rutas protegidas", () => {
    expect(getLoginRedirect("/wrapped")).toBe("/auth/login?callbackUrl=%2Fwrapped");
  });

  it("respeta callbackUrl interna despues del login", () => {
    expect(getPostLoginRedirect("/perfil", "CLIENTE")).toBe("/perfil");
  });

  it("manda al dashboard si admin intenta callbackUrl de cliente", () => {
    expect(getPostLoginRedirect("/perfil", "ADMINISTRADOR")).toBe("/admin/dashboard");
  });
});

describe("isProtectedPath (M2 – middleware)", () => {
  it.each([
    "/admin",
    "/admin/ventas",
    "/social/amigos",
    "/social/chat",
    "/historial",
    "/historial/15",
    "/perfil",
    "/perfil/ajustes",
    "/wrapped",
  ])("%s exige sesión", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/cartelera", "/perfil/42", "/recuperar", "/socialite"])(
    "%s es pública",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    }
  );

  it("un perfil público no redirige aunque no haya sesión", () => {
    expect(getProtectedRouteRedirect("/perfil/42", undefined)).toBeNull();
  });
});
