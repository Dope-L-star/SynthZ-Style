/* Vista previa de lo que crea la IA. Corre dentro de un iframe con sandbox (sin acceso a SynthZ) y recibe el documento
   desde SynthFlow por mensaje. Esta página tiene su propia política de seguridad (ver vercel.json), distinta de la del resto del sitio. */
addEventListener('message', function(e){
  if (e.source !== parent || !e.data || typeof e.data.synthzPreview !== 'string') return;
  document.open(); document.write(e.data.synthzPreview); document.close();
}, { once:true });
