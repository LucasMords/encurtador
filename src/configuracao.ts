import { env } from "node:process";

const PORTA_PADRAO = "3000";
const PORTA_MAXIMA = 65_535;

export interface Configuracao {
  readonly host: string;
  readonly porta: number;
  readonly urlBase: string;
  readonly caminhoDoBanco: string;
}

export function lerConfiguracao(): Configuracao {
  const porta = lerPorta(env["PORT"] ?? PORTA_PADRAO);

  return {
    host: env["HOST"] ?? "0.0.0.0",
    porta,
    urlBase: lerUrlBase(env["URL_BASE"] ?? `http://localhost:${porta}`),
    caminhoDoBanco: env["CAMINHO_DO_BANCO"] ?? "encurtador.db",
  };
}

function lerPorta(texto: string): number {
  const porta = Number(texto);
  if (!Number.isInteger(porta) || porta < 1 || porta > PORTA_MAXIMA) {
    throw new Error(`PORT inválida: "${texto}"`);
  }
  return porta;
}

function lerUrlBase(texto: string): string {
  if (!URL.canParse(texto)) {
    throw new Error(`URL_BASE inválida: "${texto}"`);
  }
  return texto.replace(/\/+$/, "");
}
