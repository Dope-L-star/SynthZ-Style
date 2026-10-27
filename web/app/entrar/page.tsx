import Link from "next/link";
import "../shell.css";
import { FormularioCuenta } from "@/componentes/FormularioCuenta";

export const metadata = { title: "Entrar · SynthZ" };

export default function Entrar() {
  return (
    <main className="pagina-cuenta">
      <Link className="marca" href="/">Synth<span>Z</span></Link>
      <h1>Entra para tener más energía y guardar tus chats</h1>
      <p className="tenue">Es gratis. Si prefieres probar primero, <Link href="/">vuelve al chat</Link>.</p>
      <FormularioCuenta />
    </main>
  );
}
