import LegacyPage from '../../../componentes/LegacyPage';
import { inlineStyle } from '../../../contenido/legado/offline';
import reactTree from '../../../contenido/arboles-react/offline.json';

export const metadata = {
  title: 'Sin conexión · SynthFlow',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <LegacyPage page="offline" tree={reactTree.nodes} inlineStyle={inlineStyle} />;
}
