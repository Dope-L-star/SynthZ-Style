import cuerpo from '../../../contenido/pulsem.html.js';

/* Pulsem en Next.js: la página la arma Next y su código de siempre (core.js + pulsem.js) la hace funcionar.
   display:contents → lo de adentro queda como si fuera hijo directo de <body>, igual que en pulsem.html. */
export const metadata = {
  title: 'Pulsem · SymphorIA',
  description: 'Pulsem: el panel privado del equipo de SymphorIA (salud del sitio y avisos). Solo para el equipo.'
};

export default function Pulsem(){
  return (
    <>
      <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: cuerpo }} />
      <script src="/core.js" defer />
      <script src="/pulsem.js" defer />
      <script src="/movimiento.js" defer />
    </>
  );
}
