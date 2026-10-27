import "../shell.css";
import { FormularioCuenta } from "@/componentes/FormularioCuenta";

export const metadata = { title: "Entrar · SynthZ" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await searchParams;
  return (
    <main className="pagina-cuenta">
      <a className="marca" href="/">Synth<span>Z</span></a>
      <h1>Entra para tener más energía y guardar tus chats</h1>
      <p className="tenue">Es gratis. Si prefieres probar primero, <a href="/">vuelve al chat</a>.</p>
      <FormularioCuenta aviso={aviso} />
    </main>
  );
}
