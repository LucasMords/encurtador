import type { DatabaseSync, StatementSync } from "node:sqlite";

import type { Link, RepositorioDeLinks } from "../backend/links/link.ts";

export class RepositorioDeLinksSqlite implements RepositorioDeLinks {
  readonly #insercao: StatementSync;
  readonly #busca: StatementSync;

  constructor(banco: DatabaseSync) {
    this.#insercao = banco.prepare(
      `INSERT INTO links (codigo, url, criado_em) VALUES (?, ?, ?)
       ON CONFLICT (codigo) DO NOTHING`,
    );
    this.#busca = banco.prepare("SELECT codigo, url, criado_em FROM links WHERE codigo = ?");
  }

  salvar({ codigo, url, criadoEm }: Link): boolean {
    return this.#insercao.run(codigo, url, criadoEm).changes === 1;
  }

  buscarPorCodigo(codigo: string): Link | undefined {
    const linha = this.#busca.get(codigo);
    if (linha === undefined) {
      return undefined;
    }
    return {
      codigo: String(linha["codigo"]),
      url: String(linha["url"]),
      criadoEm: String(linha["criado_em"]),
    };
  }
}
