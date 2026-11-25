import { DatabaseSync } from "node:sqlite";

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS links (
    codigo    TEXT PRIMARY KEY,
    url       TEXT NOT NULL,
    criado_em TEXT NOT NULL
  ) STRICT
`;

export function abrirBanco(caminho: string): DatabaseSync {
  const banco = new DatabaseSync(caminho);
  banco.exec("PRAGMA journal_mode = WAL");
  banco.exec(ESQUEMA);
  return banco;
}
