import LegacyPage from '../../componentes/LegacyPage';
import { inlineStyle } from '../../contenido/legado/index';
import reactTree from '../../contenido/arboles-react/index.json';

export const metadata = {
  title: 'SymphorIA · tu IA gratuita en una mesa',
  description: 'SymphorIA: pregunta, crea, programa y compara modelos de inteligencia artificial desde un solo lugar.',
  alternates: { canonical: '/' },
  openGraph: { title: 'SymphorIA · En sintonía con la IA', type: 'website', url: '/' },
};

export default function HomePage() {
  return <LegacyPage page="inicio" tree={reactTree.nodes} inlineStyle={inlineStyle} stylesheets={['index.css', 'core.css', 'movimiento.css']} scripts={['core.js', 'synthonia.js', 'index.js', 'movimiento.js']} puter />;
}
