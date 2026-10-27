import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SynthZ",
  description: "Muchas IA gratis en un solo lugar: pregunta, compara y crea.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

/* Aplica tema y color guardados antes de pintar, para que no parpadee */
const preludio = `try{var d=document.documentElement,t=localStorage.getItem("sz-tema"),c=localStorage.getItem("sz-color");d.dataset.tema=t||(matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro");d.dataset.color=c||"aurora"}catch(e){document.documentElement.dataset.color="aurora"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-color="aurora" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Chakra+Petch:wght@500;700&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: preludio }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
