import { TAMANHO_MAXIMO_DA_URL } from "../links/validador-de-url.ts";

const TAG = "Links";

export const esquemaDeCriacao = {
  tags: [TAG],
  summary: "Cria um link curto",
  body: {
    type: "object",
    required: ["url"],
    properties: {
      url: {
        type: "string",
        minLength: 1,
        maxLength: TAMANHO_MAXIMO_DA_URL,
        description: "URL http ou https que será encurtada",
        examples: ["https://exemplo.com/pagina"],
      },
    },
  },
  response: {
    201: {
      description: "Link criado",
      type: "object",
      required: ["codigo", "url", "criadoEm", "urlCurta"],
      properties: {
        codigo: { type: "string", examples: ["CBkXep9"] },
        url: { type: "string", examples: ["https://exemplo.com/pagina"] },
        criadoEm: { type: "string", examples: ["2026-01-01T00:00:00.000Z"] },
        urlCurta: { type: "string", examples: ["http://localhost:3000/CBkXep9"] },
      },
    },
    400: descreverErro("Corpo da requisição ou URL inválidos"),
    413: descreverErro("Corpo da requisição grande demais"),
    415: descreverErro("Tipo de conteúdo não suportado"),
    503: descreverErro("Não foi possível gerar um código; tente novamente"),
  },
} as const;

export const esquemaDeRedirecionamento = {
  tags: [TAG],
  summary: "Redireciona para a URL original",
  description:
    "Abra a URL curta diretamente no navegador. O botão Execute segue o redirecionamento " +
    "e pode mostrar 'Failed to fetch' se o site de destino bloquear o acesso (CORS).",
  params: {
    type: "object",
    required: ["codigo"],
    properties: {
      codigo: { type: "string", description: "Código do link curto", examples: ["CBkXep9"] },
    },
  },
  response: {
    302: { description: "Redirecionamento para a URL original", type: "null" },
    404: descreverErro("Link não encontrado"),
  },
} as const;

function descreverErro(description: string) {
  return {
    description,
    type: "object",
    required: ["erro", "mensagem"],
    properties: {
      erro: { type: "string" },
      mensagem: { type: "string" },
    },
  } as const;
}
