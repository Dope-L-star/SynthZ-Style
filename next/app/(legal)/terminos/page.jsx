import Legal from '../../../componentes/Legal';
import { meta } from '../../../componentes/meta';
import Contenido, { titulo, bajada } from '../../../contenido/terminos';

const desc = 'Las reglas para usar SymphorIA, en palabras sencillas.';
export const metadata = meta('Términos · SymphorIA', desc, '/terminos.html');

export default function Pagina(){
  return <Legal actual="terminos.html" titulo={titulo} bajada={bajada}><Contenido /></Legal>;
}
