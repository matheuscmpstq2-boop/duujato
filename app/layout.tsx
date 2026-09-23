import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duu Jato | Agendamento",
  description: "Agende a lavagem do seu veículo de forma simples e rápida.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
