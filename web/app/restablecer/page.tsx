import "../shell.css";
import { NuevaClave } from "@/componentes/NuevaClave";

export const metadata = { title: "Nueva contraseña · SynthZ" };

export default function Restablecer() {
  return (
    <main className="pagina-cuenta">
      <a className="marca" href="/">Synth<span>Z</span></a>
      <h1>Pon tu contraseña nueva</h1>
      <NuevaClave />
    </main>
  );
}
