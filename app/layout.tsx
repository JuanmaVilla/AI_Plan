import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Hay Equipo",
  description: "Organizador de tareas para equipos chicos, diseñado contra la saturación.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("dark h-full", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
