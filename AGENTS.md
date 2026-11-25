# AGENTS.md

Instruções para agentes de IA que trabalham neste repositório.

## Projeto

Encurtador de URLs: recebe uma URL longa, gera um código curto e redireciona
quem acessa o código para a URL original.

A API é aberta e pública: **não há autenticação**, e ela não deve ser adicionada.

**Estado atual:** backend, controle de dados e frontend implementados.

## Stack

- Linguagem: TypeScript
- Runtime: Node.js LTS (24 ou superior), executando o TypeScript do
  backend sem etapa de build
- Gerenciador de pacotes: npm (não use yarn, pnpm ou bun)
- Framework HTTP: Fastify, pelo suporte a TypeScript e pela
  validação por schema
- Banco de dados: SQLite, pelo módulo nativo `node:sqlite`
- Documentação da API: Swagger (`@fastify/swagger` e `@fastify/swagger-ui`)
- Testes: `node:test`
- Formatação: Biome (`biome.json`)
- Frontend: React com Vite, servido pelo próprio Fastify (`@fastify/static`) a
  partir de `dist/`; QR Code com `qrcode.react`; tema claro ou escuro conforme o
  sistema

Não escolha por conta própria o que está "a definir" nem troque o que já foi
decidido: pergunte e registre a decisão aqui.

## Estrutura

```text
src/
  servidor.ts       ponto de entrada; monta e injeta as dependências
  configuracao.ts   leitura das variáveis de ambiente
  backend/links/    regras de negócio e interface do repositório
  backend/http/     rotas Fastify e respostas de erro
  dados/            controle de dados (SQLite)
  frontend/         interface web (React); tem seu próprio tsconfig.json
    api/            chamadas HTTP ao backend
    componentes/    componentes React
testes/             testes automatizados
dist/               saída do build do frontend (não versionada)
```

## API

| Rota           | Sucesso                                         | Erros              |
| -------------- | ----------------------------------------------- | ------------------ |
| `POST /links`  | 201 com `codigo`, `url`, `criadoEm`, `urlCurta` | 400, 413, 415, 503 |
| `GET /:codigo` | 302 para a URL original                         | 404                |

O corpo de `POST /links` é `{ "url": "https://..." }`. Os erros têm o formato
`{ "erro": "...", "mensagem": "..." }`.

A documentação interativa (Swagger UI) fica em `/docs`, e o OpenAPI em JSON, em
`/docs/json`. Toda rota nova deve ter um `schema` com resumo, entradas e respostas.

## Variáveis de ambiente

| Variável           | Padrão                    | Uso                          |
| ------------------ | ------------------------- | ---------------------------- |
| `HOST`             | `0.0.0.0`                 | Endereço em que a API escuta |
| `PORT`             | `3000`                    | Porta                        |
| `URL_BASE`         | `http://localhost:<PORT>` | Início das URLs curtas       |
| `CAMINHO_DO_BANCO` | `encurtador.db`           | Arquivo do SQLite            |

## Comandos

| Tarefa                           | Comando                |
| -------------------------------- | ---------------------- |
| Instalar dependências            | `npm install`          |
| API em desenvolvimento           | `npm run dev`          |
| Frontend em desenvolvimento      | `npm run dev:frontend` |
| Gerar o build do frontend        | `npm run build`        |
| Rodar em produção (após o build) | `npm start`            |
| Rodar os testes                  | `npm test`             |
| Verificar os tipos               | `npm run typecheck`    |
| Formatar o código                | `npm run format`       |
| Lint                             | _a definir_            |

Ao criar scripts no `package.json`, registre-os nesta tabela.

## Princípios de engenharia

- **SOLID:**
  - **S, responsabilidade única:** cada módulo ou classe tem um só motivo para
    mudar (ex.: gerar o código curto não é tarefa da rota HTTP).
  - **O, aberto/fechado:** acrescente comportamento por extensão, sem alterar
    código que já funciona (ex.: uma nova estratégia de geração de códigos).
  - **L, substituição de Liskov:** toda implementação respeita o contrato da sua
    interface (ex.: trocar o repositório SQLite por um em memória nos testes).
  - **I, segregação de interfaces:** prefira interfaces pequenas; ninguém depende
    de métodos que não usa.
  - **D, inversão de dependência:** as regras de negócio dependem de interfaces, e
    o banco e o framework HTTP são injetados.
- **Divisão em camadas:** o projeto deve ser separado em três camadas:
  - **Frontend:** interface com o usuário; fala com o backend apenas pela API
    HTTP e não acessa o banco.
  - **Backend:** rotas HTTP e regras de negócio (validar URLs, gerar códigos,
    redirecionar); não contém SQL.
  - **Controle de dados:** única camada que acessa o banco (consultas,
    persistência e migrações); não contém regras de negócio nem conhece HTTP.
- **KISS:** prefira a solução mais simples que atende ao requisito.
- **YAGNI:** não implemente o que ainda não foi pedido.
- **DRY:** não duplique regras de negócio; tolere pequenas repetições quando a
  abstração custar mais.
- **Falhe cedo:** valide as entradas na borda e não silencie erros.

Em caso de conflito, KISS e YAGNI prevalecem sobre o SOLID: não crie interfaces
ou camadas extras só para cumpri-lo. As três camadas acima são obrigatórias.

## Estilo de código

- **É proibido aninhar ternários.** Um ternário simples é permitido; com mais de
  uma condição, use retorno antecipado, `if` ou um mapa.
- **Para escolher entre muitas opções (três ou mais), use um mapa de id para
  função**, em vez de `switch` ou de uma cadeia de `if/else`:

  ```ts
  // Errado: ternários aninhados
  const codigo =
    tipo === "aleatorio" ? gerarAleatorio()
    : tipo === "sequencial" ? gerarSequencial()
    : gerarPersonalizado();

  // Certo: mapa de id para função
  type TipoDeCodigo = "aleatorio" | "sequencial" | "personalizado";

  const geradores: Record<TipoDeCodigo, () => string> = {
    aleatorio: gerarAleatorio,
    sequencial: gerarSequencial,
    personalizado: gerarPersonalizado,
  };

  const codigo = geradores[tipo]();
  ```

  Se o id vier de fora (requisição, banco), valide-o antes de consultar o mapa.
- **Preze pela organização do código:**
  - Cada arquivo trata de um só assunto e fica na pasta da sua camada.
  - Escreva funções curtas, com um único propósito e nomes descritivos.
  - Prefira retorno antecipado a blocos aninhados.
  - Agrupe os imports: módulos do Node, pacotes externos, arquivos do projeto.
  - Dê nome a valores fixos em vez de espalhar números e textos soltos.
  - Remova código morto, comentado ou não utilizado.

## Código e dependências

- Use `strict: true` no `tsconfig.json`; evite `any` (prefira `unknown` e
  valide os dados que vêm de fora).
- Versione o `package-lock.json` e nunca o edite à mão.
- Não versione `node_modules/` nem a saída da compilação.
- Antes de adicionar um pacote, veja se a API nativa do Node já resolve.

## Cuidados do domínio

- Aceite apenas URLs `http` e `https`; rejeite esquemas como `javascript:`,
  `data:` e `file:`.
- Garanta a unicidade do código curto no banco (restrição única) e trate
  colisões; não confie só em uma consulta prévia.
- Gere códigos com fonte aleatória segura se eles não puderem ser adivinhados.
- Código inexistente deve responder 404.
- Use redirecionamento 302 se for preciso contar acessos ou editar destinos;
  o 301 fica em cache no navegador.

## Como trabalhar

- Faça mudanças pequenas e focadas no que foi pedido.
- Acompanhe código novo com testes e rode-os antes de concluir.
- Nunca versione segredos (`.env`, senhas, tokens).
- Atualize este arquivo quando a stack, a estrutura ou os comandos mudarem.
