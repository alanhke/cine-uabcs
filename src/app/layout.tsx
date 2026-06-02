import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cine UABCS",
  description: "Compra boletos, dulcería y conecta con amigos en el cine universitario",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <Header />
            <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-lg pb-safe md:max-w-4xl lg:max-w-6xl md:pb-8">
              {children}
            </main>
            <MobileNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
