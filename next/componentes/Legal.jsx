import '../app/(legal)/legal.css';

/* Términos y Privacidad comparten la misma cabecera, el mismo ancho y el mismo pie */
export default function Legal({ actual, titulo, bajada, children }){
  const link = (href, txt) => <a href={href} aria-current={actual === href ? 'page' : undefined}>{txt}</a>;
  return (
    <>
      <header className="top">
        <a className="logo" href="index.html"><img src="media/v30/symphoria.svg" alt="" />Symphor<span className="gS">IA</span></a>
        <nav>{link('privacidad.html', 'Privacidad')}{link('terminos.html', 'Términos')}<a href="index.html">Volver a SymphorIA</a></nav>
      </header>
      <main>
        <h1>{titulo}</h1>
        <p className="sub">{bajada}</p>
        {children}
      </main>
      <footer>SymphorIA y SynthFlow · Hecho en Colombia.</footer>
    </>
  );
}
