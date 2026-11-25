import { type FormEvent, useState } from "react";

const ID_DO_CAMPO = "url";
const ID_DO_ERRO = "erro-da-url";

interface Props {
  readonly enviando: boolean;
  readonly erro: string | undefined;
  readonly aoEnviar: (url: string) => Promise<void>;
}

export function FormularioDeLink({ enviando, erro, aoEnviar }: Props) {
  const [url, setUrl] = useState("");

  function enviar(evento: FormEvent): void {
    evento.preventDefault();
    if (!enviando) {
      void aoEnviar(url.trim());
    }
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label htmlFor={ID_DO_CAMPO}>Endereço longo</label>
      <div className="campos">
        <input
          id={ID_DO_CAMPO}
          type="url"
          required
          autoFocus
          autoComplete="off"
          placeholder="https://exemplo.com/pagina"
          value={url}
          aria-invalid={erro !== undefined}
          aria-describedby={ID_DO_ERRO}
          onChange={(evento) => setUrl(evento.target.value)}
        />
        <button type="submit" aria-disabled={enviando}>
          {enviando ? "Encurtando…" : "Encurtar"}
        </button>
      </div>
      <p id={ID_DO_ERRO} className="erro" role="alert">
        {erro}
      </p>
    </form>
  );
}
