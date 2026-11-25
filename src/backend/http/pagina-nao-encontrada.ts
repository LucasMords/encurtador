import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ARQUIVO_DA_PAGINA = "nao-encontrado.html";

/** Retorna `undefined` se o build do frontend não existe. */
export function lerPaginaNaoEncontrada(pastaDoFrontend: string): string | undefined {
  const caminho = join(pastaDoFrontend, ARQUIVO_DA_PAGINA);
  if (!existsSync(caminho)) {
    return undefined;
  }
  return readFileSync(caminho, "utf8");
}
