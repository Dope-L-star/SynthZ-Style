/* ===== v3.4 · fotos para todas las IAs, revisión de lógica y switches con el color del tema: SynthonIA lo cuenta ===== */
WHATSNEW.v = '3.4';
WHATSNEW.items.unshift(
  ['chat', LANG === 'en'
    ? 'Photos and files work with every AI again. If the AI you chose can\'t see photos, another one looks at it, copies its text and describes it for her.'
    : 'Las fotos y archivos vuelven a funcionar con todas las IAs. Si la IA que elegiste no ve fotos, otra la mira por ella, copia su texto y se la describe.'],
  ['chat', LANG === 'en'
    ? 'Better answers: every AI follows the same quality rules, and the new «Logic check» rereads each answer and fixes it if something is off (never more than 30 seconds). You can turn it off in Settings › AIs.'
    : 'Respuestas mejores: todas las IAs siguen las mismas reglas de calidad, y la nueva «Revisión de lógica» relee cada respuesta y la corrige si algo está mal (nunca más de 30 segundos). Se apaga en Ajustes › IAs.'],
  ['ajustes', LANG === 'en'
    ? 'The switches in Settings light up again, with the colors of the theme you chose.'
    : 'Los switches de Ajustes vuelven a tener color: el del tema que elegiste.']
);
BOT_FAQ.unshift(
  { k:'foto fotos imagen imagenes subir adjuntar archivo archivos pdf no deja ve ver leer photo photos image images upload attach file files see read',
    a:'Toca el «+» junto a la caja (o arrastra la foto) y escribe tu pregunta. Todas las IAs pueden con fotos: las que ven la reciben tal cual, y a las que no ven, otra IA les describe la foto con su texto copiado. Los PDF y archivos de texto los leen todas.',
    en:'Tap the «+» next to the box (or drag the photo in) and write your question. Every AI can handle photos: the ones that see get it as is, and for the ones that don\'t, another AI describes the photo and copies its text. PDFs and text files are read by all of them.' },
  { k:'revision logica revisada mejorada respuesta corrige corregida segunda pasada logic check checked improved answer fix second pass',
    a:'La «Revisión de lógica» relee cada respuesta como una revisora: si está bien, verás «✓ Lógica revisada»; si encuentra un error o le falta algo, la cambia por la corregida y verás «✨ Revisada». Nunca tarda más de 30 segundos. La apagas en Ajustes › IAs y memoria.',
    en:'The «Logic check» rereads each answer like a reviewer: if it is fine you will see «✓ Logic checked»; if it finds a mistake or something missing, it swaps it for the fixed one and you will see «✨ Checked». It never takes more than 30 seconds. Turn it off in Settings › AIs and memory.', pre:openCfg('ia') }
);
