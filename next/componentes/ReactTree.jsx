import { createElement } from 'react';

/*
 * Renderiza un árbol de HTML convertido a datos en elementos React reales.
 * Los datos se generan en desarrollo desde las páginas de origen. No ejecuta
 * atributos de evento de HTML; acciones muy pequeñas se marcan como data-*
 * y las gestiona LegacyRuntime del lado cliente.
 */
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const BOOL = new Set([
  'allowfullscreen','async','autofocus','autoplay','checked','controls','default','defer','disabled','formnovalidate',
  'hidden','inert','ismap','itemscope','loop','multiple','muted','nomodule','novalidate','open','playsinline',
  'readonly','required','reversed','scoped','seamless','selected'
]);
const ATTR = {
  'class': 'className', 'for': 'htmlFor', 'tabindex': 'tabIndex', 'crossorigin': 'crossOrigin',
  'referrerpolicy': 'referrerPolicy', 'spellcheck': 'spellCheck', 'contenteditable': 'contentEditable',
  'autocapitalize': 'autoCapitalize', 'autocomplete': 'autoComplete', 'autofocus': 'autoFocus',
  'formaction': 'formAction', 'formenctype': 'formEncType', 'formmethod': 'formMethod',
  'formnovalidate': 'formNoValidate', 'formtarget': 'formTarget', 'maxlength': 'maxLength',
  'minlength': 'minLength', 'readonly': 'readOnly', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
  'frameborder': 'frameBorder', 'cellpadding': 'cellPadding', 'cellspacing': 'cellSpacing',
  'srcset': 'srcSet', 'usemap': 'useMap', 'datetime': 'dateTime', 'srcdoc': 'srcDoc',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset', 'stroke-miterlimit': 'strokeMiterlimit',
  'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'clip-path': 'clipPath', 'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity', 'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity',
  'viewbox': 'viewBox', 'preserveaspectratio': 'preserveAspectRatio', 'gradientunits': 'gradientUnits',
  'gradienttransform': 'gradientTransform', 'patternunits': 'patternUnits', 'patterntransform': 'patternTransform',
  'markerwidth': 'markerWidth', 'markerheight': 'markerHeight', 'refx': 'refX', 'refy': 'refY',
  'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'focusable': 'focusable',
  'attributename': 'attributeName', 'attributetype': 'attributeType', 'repeatcount': 'repeatCount',
  'stddeviation': 'stdDeviation', 'maskunits': 'maskUnits', 'pathlength': 'pathLength',
  'basefrequency': 'baseFrequency', 'numoctaves': 'numOctaves', 'kernelmatrix': 'kernelMatrix',
  'kernelunitlength': 'kernelUnitLength', 'keypoints': 'keyPoints', 'keytimes': 'keyTimes',
  'keysplines': 'keySplines', 'calcmode': 'calcMode', 'surfacescale': 'surfaceScale',
  'diffuseconstant': 'diffuseConstant', 'specularconstant': 'specularConstant', 'specularexponent': 'specularExponent'
};
const SVG_TAG = {
  'lineargradient': 'linearGradient', 'radialgradient': 'radialGradient', 'animatemotion': 'animateMotion',
  'animatetransform': 'animateTransform', 'fegaussianblur': 'feGaussianBlur', 'femerge': 'feMerge',
  'femergenode': 'feMergeNode', 'feoffset': 'feOffset', 'fecolormatrix': 'feColorMatrix',
  'fecomponenttransfer': 'feComponentTransfer', 'fefunca': 'feFuncA', 'fefuncr': 'feFuncR',
  'fefuncg': 'feFuncG', 'fefuncb': 'feFuncB', 'feturbulence': 'feTurbulence', 'fecomposite': 'feComposite',
  'feflood': 'feFlood', 'femorphology': 'feMorphology', 'fediffuselighting': 'feDiffuseLighting',
  'fespecularlighting': 'feSpecularLighting', 'fedistantlight': 'feDistantLight', 'fepointlight': 'fePointLight',
  'fespotlight': 'feSpotLight', 'foreignobject': 'foreignObject', 'clippath': 'clipPath', 'textpath': 'textPath'
};

function cssProperty(name) {
  if (name.startsWith('--')) return name;
  if (name.startsWith('-webkit-')) return 'Webkit' + name.slice(8).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (name.startsWith('-moz-')) return 'Moz' + name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (name.startsWith('-ms-')) return 'ms' + name.slice(4).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (name.startsWith('-o-')) return 'O' + name.slice(3).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function parseStyle(source) {
  const style = {};
  // Split only at semicolons outside quoted strings and parentheses.
  let chunks = [], start = 0, depth = 0, quote = '';
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quote) { if (c === quote && source[i - 1] !== '\\') quote = ''; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) { chunks.push(source.slice(start, i)); start = i + 1; }
  }
  chunks.push(source.slice(start));
  for (const chunk of chunks) {
    const at = chunk.indexOf(':');
    if (at < 1) continue;
    const name = chunk.slice(0, at).trim().toLowerCase();
    let value = chunk.slice(at + 1).trim();
    if (!name || !value) continue;
    // React's style object cannot express !important; preserve the valid value.
    value = value.replace(/\s*!important\s*$/i, '').trim();
    style[cssProperty(name)] = value;
  }
  return style;
}

function propsFrom(attrs = {}) {
  const props = {};
  for (const [rawName, rawValue] of Object.entries(attrs)) {
    const name = rawName.toLowerCase();
    if (name === 'onclick') {
      if (/location\s*\.\s*reload\s*\(/i.test(String(rawValue))) props['data-legacy-action'] = 'reload';
      continue;
    }
    if (name === 'onerror') {
      if (/this\s*\.\s*remove\s*\(/i.test(String(rawValue))) props['data-legacy-onerror'] = 'remove';
      continue;
    }
    // Never evaluate raw inline event handlers from HTML attributes.
    if (name.startsWith('on')) continue;
    const value = BOOL.has(name) ? (rawValue === true || rawValue === '' || rawValue === name) : rawValue;
    const propName = ATTR[name] || name;
    props[propName] = name === 'style' && typeof rawValue === 'string' ? parseStyle(rawValue) : value;
  }
  return props;
}

function renderNode(node, key) {
  if (!node) return null;
  if (node.type === 'text') return node.value;
  if (node.type !== 'element' || !node.tag) return null;
  const rawTag = String(node.tag).toLowerCase();
  const tag = SVG_TAG[rawTag] || rawTag;
  const props = { ...propsFrom(node.attrs), key };
  if (VOID.has(rawTag)) return createElement(tag, props);
  const children = (node.children || []).map((child, i) => renderNode(child, `${key}.${i}`));
  return createElement(tag, props, children);
}

export default function ReactTree({ nodes = [] }) {
  return nodes.map((node, index) => renderNode(node, String(index)));
}
