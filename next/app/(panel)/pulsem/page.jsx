import LegacyPage from '../../../componentes/LegacyPage';
import { inlineStyle } from '../../../contenido/legado/pulsem';
import reactTree from '../../../contenido/arboles-react/pulsem.json';

export const metadata = {
  title: 'Pulsem · SymphorIA',
  description: 'Pulsem: el panel privado del equipo de SymphorIA (salud del sitio y avisos). Solo para el equipo.',
  robots: { index: false, follow: false },
};

export default function Pulsem() {
  return <LegacyPage page="pulsem" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['pulsem.css', 'core.css', 'movimiento.css']} scripts={['core.js', 'pulsem.js', 'movimiento.js']} />;
}
