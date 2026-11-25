import { useState } from "react";

type Situacao = "pronto" | "copiado" | "falhou";

const avisos: Record<Situacao, string> = {
  pronto: "",
  copiado: "Link copiado.",
  falhou: "O navegador não permitiu copiar. Selecione o link e copie manualmente.",
};

interface Props {
  readonly texto: string;
}

export function BotaoDeCopiar({ texto }: Props) {
  const [situacao, setSituacao] = useState<Situacao>("pronto");

  async function copiar(): Promise<void> {
    try {
      // Sem HTTPS (exceto em localhost), navigator.clipboard não existe e cai no catch.
      await navigator.clipboard.writeText(texto);
      setSituacao("copiado");
    } catch {
      setSituacao("falhou");
    }
  }

  return (
    <div className="copiar">
      <button type="button" onClick={() => void copiar()}>
        Copiar link
      </button>
      <span role="status">{avisos[situacao]}</span>
    </div>
  );
}
