import process from "node:process";

import { criarApp } from "./backend/http/app.ts";
import { Encurtador } from "./backend/links/encurtador.ts";
import { gerarCodigo } from "./backend/links/gerador-de-codigo.ts";
import { lerConfiguracao } from "./configuracao.ts";
import { abrirBanco } from "./dados/banco.ts";
import { RepositorioDeLinksSqlite } from "./dados/repositorio-de-links-sqlite.ts";

const configuracao = lerConfiguracao();
const banco = abrirBanco(configuracao.caminhoDoBanco);
const encurtador = new Encurtador(new RepositorioDeLinksSqlite(banco), gerarCodigo);
const app = criarApp({ encurtador, urlBase: configuracao.urlBase, registrarLogs: true });

app.addHook("onClose", async () => banco.close());

for (const sinal of ["SIGINT", "SIGTERM"] as const) {
  process.once(sinal, () => void app.close());
}

await app.listen({ host: configuracao.host, port: configuracao.porta });
