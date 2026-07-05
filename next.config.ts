import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tree-shaking más agresivo en librerías de imports por nombre:
  // solo entra al bundle el ícono/función que se usa, no todo el paquete.
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "date-fns"],
    // La foto de perfil se sube por server action; el default de 1MB es poco.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Quita console.* en producción (deja error/warn) para un bundle más liviano.
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};

export default nextConfig;
