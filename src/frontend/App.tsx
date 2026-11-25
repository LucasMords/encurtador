import { useState } from "react";

import { criarLink, ErroDaApi, type LinkCriado } from "./api/links.ts";
import { Comprovante } from "./componentes/Comprovante.tsx";
import { FormularioDeLink } from "./componentes/FormularioDeLink.tsx";

const MENSAGEM_INESPERADA = "Algo deu errado. Recarregue a página e tente de novo.";

export function App() {
  const [link, setLink] = useState<LinkCriado>();
  const [erro, setErro] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function encurtar(url: string): Promise<void> {
    setEnviando(true);
    setErro(undefined);
    setLink(undefined);
    try {
      setLink(await criarLink(url));
    } catch (falha) {
      setErro(descreverFalha(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="pagina">
      <header>
        <h1>Encurtador de URLs</h1>
        <p className="apoio">Cole um endereço longo e receba um link curto para compartilhar.</p>
      </header>

      <FormularioDeLink enviando={enviando} erro={erro} aoEnviar={encurtar} />

      <div aria-live="polite">
        {link && <Comprovante key={link.urlCurta} link={link} />}
      </div>
    </main>
  );
}

function descreverFalha(falha: unknown): string {
  if (falha instanceof ErroDaApi) {
    return falha.message;
  }
  console.error(falha);
  return MENSAGEM_INESPERADA;
}
