import LegacyPage from '../../../componentes/LegacyPage';
import { inlineStyle } from '../../../contenido/legado/ayuda';
import reactTree from '../../../contenido/arboles-react/ayuda.json';

export const metadata = {
  title: 'Ayuda · SymphorIA',
  description: 'Respuestas rápidas sobre SymphorIA y cómo hablar con el equipo.',
  alternates: { canonical: '/ayuda.html' },
};

export default function AyudaPage() {
  return <LegacyPage page="ayuda" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['movimiento.css']} scripts={['ayuda.js', 'movimiento.js']} />;
}
