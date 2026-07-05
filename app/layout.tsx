import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Plan — by Hay Equipo IA",
  description: "AI Plan, by Hay Equipo IA — organizate sin saturarte: metas, proyectos, objetivos y tareas para equipos chicos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("dark h-full", "font-sans")}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark')}else{d.classList.add('dark')}}catch(e){}})()`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
