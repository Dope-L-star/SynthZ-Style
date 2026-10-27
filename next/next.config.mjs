/* Next.js en modo export estático: «next build» deja la página lista en next/out (sin servidor de Next).
   /api lo sigue sirviendo el resto del proyecto (Vercel o la función de Cloudflare), con rutas relativas /api/… */
export default {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  poweredByHeader: false,
  reactStrictMode: true
};
