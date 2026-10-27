import "./shell.css";
import { AnilloEnergia } from "@/componentes/AnilloEnergia";
import { Ajustes } from "@/componentes/Ajustes";

/* Fase 1: la estructura de Atlas/Consola con datos de ejemplo. El chat real llega en la fase 2. */
export default function Inicio() {
  return (
    <div className="app">
      <aside className="riel" aria-label="Chats">
        <span className="marca">Synth<span>Z</span></span>
        <button className="boton">+ Nuevo chat</button>
        <span className="etiqueta">Hoy</span>
        <ul className="lista">
          <li><button aria-current="true">Teletrabajo vs. trabajo en casa</button></li>
          <li><button>Plan de estudio de cálculo</button></li>
          <li><button>Correo para el profe</button></li>
        </ul>
        <span className="etiqueta">Equipos</span>
        <ul className="lista">
          <li><button>Semillero IA · 8 personas</button></li>
          <li><button>Tesis grupo 3</button></li>
        </ul>
      </aside>

      <main className="centro">
        <div className="barra">
          <button className="chip" aria-pressed="true">Automática</button>
          <button className="chip" aria-pressed="false">Una IA</button>
          <button className="chip" aria-pressed="false">Comparar</button>
          <button className="chip" aria-pressed="false">Síntesis</button>
        </div>
        <div className="hilo">
          <div className="tu">¿Qué diferencia hay entre teletrabajo y trabajo en casa en Colombia?</div>
          <div className="ia">
            <p>
              El teletrabajo es una forma de trabajo pactada y permanente, regulada por la Ley 1221 de 2008<sup>1</sup>. El
              trabajo en casa, de la Ley 2088 de 2021, es temporal y se usa en situaciones excepcionales<sup>2</sup>.
            </p>
            <div className="fuentes">
              <span><b>1</b> funcionpublica.gov.co</span>
              <span><b>2</b> mintrabajo.gov.co</span>
            </div>
          </div>
        </div>
        <div className="caja">
          <textarea aria-label="Escribe tu pregunta" placeholder="Pregunta lo que quieras…" rows={1} />
          <div className="fila">
            <button className="chip">+ Adjuntar</button>
            <button className="chip">Buscar en internet</button>
            <button className="chip">Imagen</button>
            <button className="boton">Enviar</button>
          </div>
        </div>
      </main>

      <aside className="panel" aria-label="Detalles">
        <span className="etiqueta">Tu energía de hoy</span>
        <div className="anillo-fila">
          <AnilloEnergia porcentaje={62} />
          <div><b>Vas bien</b><span>Se llena a medianoche</span></div>
        </div>
        <span className="etiqueta">Esta respuesta</span>
        <dl className="datos">
          <dt>IA</dt><dd>Llama 3.3 70B</dd>
          <dt>Proveedor</dt><dd>Groq</dd>
          <dt>Tiempo</dt><dd>1,2 s</dd>
          <dt>Energía</dt><dd>1 %</dd>
          <dt>Fuentes</dt><dd>2</dd>
        </dl>
        <div className="nota">Respondió Groq porque Mistral estaba ocupado. No tienes que hacer nada.</div>
        <span className="etiqueta">Apariencia</span>
        <Ajustes />
      </aside>
    </div>
  );
}
