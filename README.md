# Encurtador de URLs

Recebe uma URL longa, gera um código curto e redireciona quem acessa o código para a
URL original. Tem uma interface web, com QR Code e tema claro ou escuro, e uma API
aberta e pública, que não exige autenticação.

## Tecnologias

- [Node.js](https://nodejs.org/) 24 ou superior, executando o TypeScript do
  backend sem etapa de build
- [Fastify](https://fastify.dev/) para a API HTTP e para servir a interface
- [React](https://react.dev/) e [Vite](https://vite.dev/) para a interface
- SQLite, pelo módulo nativo `node:sqlite`
- Swagger para a documentação da API
- `node:test` para os testes

## Como rodar

Requer Node.js 24 ou superior e npm.

```bash
git clone https://github.com/LucasMords/encurtador.git
cd encurtador
npm install
npm run build
npm start
```

A interface fica em <http://localhost:3000> e a documentação interativa da API, em
<http://localhost:3000/docs>. O banco é criado automaticamente na primeira execução.

### Desenvolvimento

Rode a API e o frontend em dois terminais e abra o endereço mostrado pelo Vite, que
encaminha as chamadas de `/links` para a API em `localhost:3000`:

```bash
npm run dev
npm run dev:frontend
```

### Comandos

| Tarefa                           | Comando                |
| -------------------------------- | ---------------------- |
| API em desenvolvimento           | `npm run dev`          |
| Frontend em desenvolvimento      | `npm run dev:frontend` |
| Gerar o build do frontend        | `npm run build`        |
| Rodar em produção (após o build) | `npm start`            |
| Rodar os testes                  | `npm test`             |
| Verificar os tipos               | `npm run typecheck`    |

### Configuração

As opções são lidas de variáveis de ambiente, todas opcionais:

| Variável           | Padrão                    | Uso                          |
| ------------------ | ------------------------- | ---------------------------- |
| `HOST`             | `0.0.0.0`                 | Endereço em que a API escuta |
| `PORT`             | `3000`                    | Porta                        |
| `URL_BASE`         | `http://localhost:<PORT>` | Início das URLs curtas       |
| `CAMINHO_DO_BANCO` | `encurtador.db`           | Arquivo do SQLite            |

Por exemplo:

```bash
PORT=8080 URL_BASE=https://meu-dominio.example npm start
```

## API

| Rota             | Descrição                       | Sucesso | Erros              |
| ---------------- | ------------------------------- | ------- | ------------------ |
| `POST /links`    | Cria um link curto              | 201     | 400, 413, 415, 503 |
| `GET /:codigo`   | Redireciona para a URL original | 302     | 404                |
| `GET /`          | Interface web                   | 200     |                    |
| `GET /docs`      | Documentação interativa         | 200     |                    |
| `GET /docs/json` | OpenAPI em JSON                 | 200     |                    |

### Criar um link

```bash
curl -X POST http://localhost:3000/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/uma/pagina"}'
```

Resposta `201 Created`:

```json
{
  "codigo": "jSYoAJN",
  "url": "https://example.com/uma/pagina",
  "criadoEm": "2026-11-25T01:39:38.077Z",
  "urlCurta": "http://localhost:3000/jSYoAJN"
}
```

São aceitas apenas URLs `http` e `https`, com até 2048 caracteres.

### Acessar um link

Abra a `urlCurta` no navegador ou use o `curl`:

```bash
curl -i http://localhost:3000/jSYoAJN
```

Resposta:

```http
HTTP/1.1 302 Found
location: https://example.com/uma/pagina
```

Os códigos têm 7 caracteres e diferenciam maiúsculas de minúsculas.

### Erros

Todos os erros têm o mesmo formato:

```json
{
  "erro": "link_nao_encontrado",
  "mensagem": "Link não encontrado."
}
```

| `erro`                | Status          | Quando ocorre                                         |
| --------------------- | --------------- | ----------------------------------------------------- |
| `url_invalida`        | 400             | A URL é inválida ou não é http/https                  |
| `requisicao_invalida` | 400, 413 ou 415 | O corpo está incorreto, é grande demais ou não é JSON |
| `link_nao_encontrado` | 404             | O código não existe                                   |
| `rota_nao_encontrada` | 404             | A rota não existe                                     |
| `erro_interno`        | 500             | Houve uma falha inesperada                            |
| `codigo_indisponivel` | 503             | Não foi possível gerar um código; tente novamente     |

## Arquitetura

O projeto é dividido em três camadas:

- **Frontend:** interface em React; fala com o backend apenas pela API HTTP.
- **Backend:** rotas HTTP e regras de negócio, sem SQL.
- **Controle de dados:** única camada que acessa o banco.

As regras de negócio dependem de interfaces; o repositório e o gerador de códigos
são injetados em `src/servidor.ts`.

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

As convenções de código e os princípios do projeto estão em [AGENTS.md](AGENTS.md).
