import ReactTree from './ReactTree';
import LegacyRuntime from './LegacyRuntime';

/**
 * Estructura visual renderizada mediante elementos React reales.
 * El runtime de compatibilidad se mantiene temporalmente para no romper los
 * manejadores heredados mientras los subsistemas se trasladan a hooks.
 */
export default function LegacyPage({
  page,
  tree,
  stylesheets = [],
  inlineStyle = '',
  scripts = [],
  puter = false,
}) {
  return (
    <>
      {stylesheets.map((href) => <link rel="stylesheet" href={`/${href}`} precedence="default" key={href} />)}
      {inlineStyle ? <style data-page-style={page} dangerouslySetInnerHTML={{ __html: inlineStyle }} /> : null}
      {tree ? <ReactTree nodes={tree} /> : null}
      <LegacyRuntime page={page} scripts={scripts} puter={puter} />
    </>
  );
}
