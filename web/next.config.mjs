/** El rediseño se publica como páginas estáticas bajo /nuevo y habla con el backend de siempre (/api/*, mismo dominio). */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: "/nuevo",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
