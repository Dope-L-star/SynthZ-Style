/* ===== v3.2 · barra de escribir, lista de chats y barra Simple: SynthonIA lo cuenta y lo explica ===== */
WHATSNEW.v = '3.2';
WHATSNEW.items.unshift(
  ['chat', LANG === 'en'
    ? 'Tidier chat list: on top only «New chat» and search, and below all your chats. Projects and Synthetics stay in the icon bar; if you want them on top too, pick them in Settings › «Shortcuts in your chats».'
    : 'Lista de chats más limpia: arriba solo «Nuevo chat» y buscar, y debajo todos tus chats. Proyectos y Sintéticos siguen en la barrita de íconos; si los quieres arriba también, elígelos en Ajustes › «Atajos en tus chats».'],
  ['chat', LANG === 'en'
    ? 'The Simple style now has a sidebar like Claude\'s: Create, Projects, Synthetics, Customize and More on top, your recent chats in the middle, and your account and a magnifier to search at the bottom.'
    : 'El estilo Simple ahora tiene una barra como la de Claude: Crear, Proyectos, Sintéticos, Personalización y Más arriba, tus chats recientes en medio, y abajo tu cuenta y una lupa para buscar.'],
  ['chat', LANG === 'en'
    ? 'The writing box is lighter: «Short answers», Internet and Image are now little bubbles next to the «+» (hover to see the name, tap to turn off). And the EnerX battery is smaller.'
    : 'La caja de escribir quedó más liviana: «Respuestas cortas», Internet e Imagen ahora son bolitas junto al «+» (pasa el puntero para ver el nombre, tócalas para apagar). Y la batería EnerX es más pequeña.'],
  ['chat', LANG === 'en'
    ? 'Every new chat greets you with a different phrase. And if you don\'t know what «FlowIA» means, tap the button under the greeting: it is explained there.'
    : 'Cada chat nuevo te saluda con una frase distinta. Y si no sabes qué significa «FlowIA’r», toca el botón debajo del saludo: ahí te lo explicamos.']
);
BOT_FAQ.push(
  { k:'flow flowia flowiar flowiando flowiamos que significa que es significado palabra ingles what does mean meaning word',
    a:'«Flow» (se dice «flou») es una palabra en inglés que significa fluir, como el agua de un río: cuando todo sale fácil, sin trabarse. «IA» es la inteligencia artificial. «FlowIA’r» es un verbo que inventamos uniendo las dos: hacer lo que necesitas (escribir, estudiar, crear, programar) de forma fácil, con ayuda de la IA. «¿Qué quieres FlowIA’r hoy?» = «¿Qué quieres hacer hoy con ayuda de la IA?».',
    en:'«Flow» means flowing, like water in a river: when everything goes easy, without getting stuck. «IA» is how Spanish says AI (artificial intelligence). «FlowIA» is a word we made up by joining them: doing what you need (write, study, create, code) the easy way, with the help of AI. «What do you want to FlowIA today?» = «What would you like to do today with the help of AI?».' },
  { k:'proyectos sinteticos barra lista chats arriba quitar poner atajos projects synthetics sidebar list shortcuts top remove add',
    a:'Arriba de tu lista de chats solo van «Nuevo chat» y buscar. Si quieres también Proyectos, Sintéticos o los dos, elígelo en Ajustes › Página › «Atajos en tus chats». Siempre los tienes en la barrita de íconos de la izquierda.',
    en:'Above your chat list there are only «New chat» and search. If you also want Projects, Synthetics or both, choose it in Settings › Page › «Shortcuts in your chats». They are always in the icon bar on the left.', pre:openCfg(), go:['#cfgBtn', '[data-tab="cfg"]'] }
);
