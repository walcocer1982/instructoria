import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOPHI - Sistema Pedagógico Híbrido Inteligente",
  description: "Sistema de Enseñanza Virtual con Agentes LLM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}