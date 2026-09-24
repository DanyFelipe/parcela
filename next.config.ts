import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Permite acceder al dev server desde la IP de la red local (p. ej. para probar en celulares).
  // Solo aplica a `next dev`; en producción no tiene efecto.
  allowedDevOrigins: ['192.168.20.23'],
};

export default nextConfig;
