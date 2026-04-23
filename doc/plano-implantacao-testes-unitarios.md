# Plano de Implantacao dos Testes Unitarios

## 1. Objetivo

Estruturar uma base de testes unitarios para o projeto `ODS 6 - Agua Consciente`, cobrindo as regras de negocio, validacoes, middlewares e comportamentos principais das rotas, com o menor risco possivel para o codigo atual.

O foco inicial sera garantir confianca nas partes mais criticas do sistema:

- autenticacao e controle de acesso
- validacoes de formularios
- manipulacao de dados em memoria
- fluxos principais das rotas
- respostas de sucesso e erro

## 2. Situacao atual do projeto

O projeto hoje esta organizado como uma aplicacao Node.js com Express, EJS e dados em memoria.

Principais pontos do codigo:

- `app.js`: configuracao do Express, middlewares globais e carregamento das rotas
- `data/database.js`: camada de dados em memoria, com usuarios, denuncias e ONGs
- `middleware/auth.js`: regras de autenticacao e autorizacao
- `routes/auth.js`: login, cadastro e logout
- `routes/denuncias.js`: listagem, criacao e atualizacao de denuncias
- `routes/ongs.js`: listagem e area administrativa das ONGs
- `routes/admin.js`: fluxos administrativos ilustrativos
- `routes/index.js`: pagina inicial, planos, doacoes, noticias e paginas institucionais

### Andamento atual da implantação

Status consolidado da execução do plano até aqui:

- infra de testes configurada com `Jest` para unitários e integração
- `Playwright` configurado para testes e2e
- roteamento principal coberto com testes para `auth`, `admin`, `index`, `ongs` e `denuncias`
- camada de dados coberta com testes de leitura, escrita, atualização, persistência e reset
- helpers de sessão e utilitários de teste já adicionados ao projeto
- suíte principal atualmente passando com a base de testes instalada

Próximos focos de evolução:

- ampliar a cobertura dos trechos ainda residuais em `data/database.js`
- reforçar mais cenários e2e no navegador
- manter o plano sincronizado com cada nova etapa concluída

### Observacoes importantes

- nao existe infraestrutura de testes configurada no `package.json`
- o comando `npm test` ainda esta como placeholder
- os dados estao em memoria, entao os testes precisam limpar e reconstruir estado entre execucoes
- varios comportamentos estao acoplados diretamente aos routers, o que dificulta testes unitarios puros

## 3. Estrategia recomendada

A melhor abordagem e implantar os testes em camadas.

### Camada 1: testes unitarios puros com Jest

Testar funcoes isoladas e regras simples, sem subir servidor completo.

Alvos:

- funcoes de `data/database.js`
- middlewares de `middleware/auth.js`
- validacoes e regras de negocio simples extraidas de rotas

### Camada 2: testes de rotas com mocks usando Jest

Testar handlers com `req`, `res` e `next` simulados.

Alvos:

- rotas de `auth`
- rotas de `denuncias`
- rotas de `ongs`
- rotas de `admin`
- rotas de `index`

### Camada 3: testes de integracao leves e e2e com Playwright

Depois que a base estiver pronta, adicionar testes com `supertest` para garantir que as rotas respondem corretamente quando a aplicacao sobe em modo de teste.

Os testes e2e ficarao a cargo do `Playwright`, validando os fluxos completos do ponto de vista do usuario no navegador.

## 4. Ferramentas sugeridas

Recomendacao de stack para testes:

- `jest` para executor e assertions
- `supertest` para testar rotas HTTP
- `playwright` para testes e2e no navegador
- `node-mocks-http` ou `jest-mock-req-res` para simular `req` e `res`
- `cross-env` se for necessario padronizar variaveis de ambiente nos scripts

### Convenções de escrita dos testes

- todos os títulos de `describe` e `test` devem estar em português
- os títulos precisam descrever claramente o comportamento validado
- prefira frases objetivas como "deve redirecionar", "deve renderizar" e "deve rejeitar"
- evite nomes em inglês para facilitar a leitura e o entendimento da validação
- mantenha o mesmo padrão de linguagem em testes unitários, de integração e e2e

### Scripts recomendados

Adicionar futuramente em `package.json`:

- `test`: executa toda a suite
- `test:unit`: executa apenas testes unitarios
- `test:e2e`: executa os testes ponta a ponta com Playwright
- `test:watch`: roda testes em modo observacao
- `test:coverage`: gera relatorio de cobertura

## 5. Prioridade de implantacao

### Fase 1: base da infra

Objetivo:

- instalar e configurar a ferramenta de testes
- definir estrutura de pastas
- preparar ambiente isolado para testes

Entregas:

- configuracao inicial do Jest
- scripts no `package.json`
- arquivos de setup para testes
- padrao para limpar mocks e estado entre testes

### Fase 2: testes da camada de dados

Objetivo:

- validar a logica de criacao, busca e atualizacao de dados em memoria
- garantir que os objetos criados tenham ids e campos esperados

Casos sugeridos:

- `getUserByEmail` retorna o usuario correto
- `createUser` gera novo id incremental
- `createDenuncia` cria denuncia com status `pendente`
- `getDenunciaById` encontra denuncia existente
- `updateDenuncia` atualiza campos sem perder dados anteriores
- `createOng` cria ONG com id valido

### Fase 3: testes de middleware

Objetivo:

- garantir controle de acesso consistente

Casos sugeridos:

- `requireAuth` redireciona para login quando nao ha sessao
- `requireAuth` chama `next` quando a sessao existe
- `requireAdmin` retorna 403 para usuario comum
- `requireAdmin` permite acesso para admin
- `redirectIfLoggedIn` redireciona usuario autenticado
- `redirectIfLoggedIn` libera acesso para usuario nao autenticado

### Fase 4: testes de validacao nas rotas

Objetivo:

- assegurar que os formularios rejeitam entradas invalidas
- cobrir mensagens de erro mais importantes

Casos sugeridos:

- login invalido gera redirecionamento com mensagem
- cadastro invalido rejeita email, senha e confirmacao
- cadastro de ONG exige campos extras
- nova denuncia rejeita titulo curto, descricao curta e localizacao invalida
- formularios de doacao e assinatura rejeitam CPF, telefone, estado e nome invalidos

### Fase 5: testes das rotas principais

Objetivo:

- validar o comportamento final percebido pelo usuario

Casos sugeridos:

- pagina inicial renderiza listas e contadores
- pagina de denuncias filtra por status
- detalhes de denuncia retornam 404 quando nao existe
- admin bloqueia usuario nao autorizado
- pagina de ONG retorna 404 quando ONG nao existe
- listagem de planos e noticias renderiza os dados esperados

### Fase 6: testes e2e com Playwright

Objetivo:

- validar os fluxos reais do usuario em navegador
- confirmar que a aplicacao funciona do inicio ao fim

Casos sugeridos:

- abrir a pagina inicial e navegar para denuncias
- acessar login e validar redirecionamentos
- preencher formulario de nova denuncia
- abrir detalhes de ONG
- navegar pelos planos e doacoes
- verificar comportamentos basicos do dashboard

### Fase 7: cobertura e manutencao

Objetivo:

- consolidar cobertura minima aceitavel
- evitar regressao em novas funcionalidades

Entregas:

- meta minima de cobertura
- testes para novos endpoints ou regras
- revisao de suites quebradas em cada PR

## 6. Estrutura de pastas sugerida para testes

Uma estrutura simples e escalavel:

```text
tests/
  unit/
    data/
    middleware/
    routes/
  integration/
  e2e/
  helpers/
  fixtures/
playwright/
```

### Sugestao de organizacao

- `tests/unit/data`: funcoes puras da camada de dados
- `tests/unit/middleware`: regras de acesso
- `tests/unit/routes`: handlers com mocks
- `tests/integration`: fluxos com `supertest`
- `tests/e2e`: cenarios completos do navegador com Playwright
- `tests/helpers`: fabricas de `req`, `res`, `next` e reset de estado
- `tests/fixtures`: dados reutilizaveis para testes

### Observacao sobre Playwright

- o Playwright deve ficar focado em caminhos criticos de usuario
- ele nao substitui os testes unitarios com Jest
- ele complementa a cobertura validando a experiencia real no navegador

## 7. Pontos que exigem refatoracao leve

Para testes realmente bons, alguns ajustes no codigo vao ajudar bastante.

### 7.1 Extrair logica de negocio dos routers

Hoje muitos validadores e fluxos estao dentro dos arquivos de rota.

Recomendacao:

- mover regras repetidas para funcoes auxiliares
- separar validacao de processamento
- reduzir logica anonima dentro dos `router.post`

### 7.2 Criar um reset da camada de dados

Como o estado esta em memoria, os testes podem ficar dependentes da ordem de execucao.

Recomendacao:

- expor uma funcao de reset para recriar usuarios, ongs e denuncias
- usar essa funcao em `beforeEach`

### 7.3 Evitar dependencia direta de estado global

Ao longo da evolucao do projeto, o ideal e transformar a camada de dados em um modulo mais previsivel.

Recomendacao:

- encapsular leitura e escrita em funcoes pequenas
- passar dependencias quando possivel

## 8. Cobertura prioritaria por arquivo

### Arquivos com maior prioridade

- `middleware/auth.js`
- `data/database.js`
- `routes/auth.js`
- `routes/denuncias.js`
- `routes/ongs.js`

### Arquivos com prioridade secundaria

- `routes/index.js`
- `routes/admin.js`
- `app.js`

### Razao da prioridade

- os arquivos priorizados concentram regras de acesso, validacao e manipulação de dados
- sao os mais propensos a regressao quando novas telas ou formularios forem adicionados

## 9. Casos de teste por area

### Autenticacao

- login com email invalido
- login com senha ausente
- cadastro com nome curto
- cadastro com senha fraca
- confirmacao de senha diferente
- cadastro de ONG sem campos obrigatorios

### Denuncias

- listar denuncias sem filtro
- listar denuncias por status
- abrir denuncia existente
- abrir denuncia inexistente
- responder denuncia como admin
- atualizar status de denuncia

### ONGs

- listar ONGs cadastradas
- abrir detalhe de ONG existente
- abrir detalhe de ONG inexistente
- acessar dashboard administrativo sem permissao

### Dados

- criar registros com ids incrementais
- atualizar registro existente
- retornar `null` quando item nao existe

### Middlewares

- bloquear acesso nao autenticado
- bloquear acesso nao administrativo
- permitir acesso quando perfil bate

## 10. Padrao de testes recomendado

### AAA

Usar o padrao `Arrange - Act - Assert` para manter os testes legiveis.

Exemplo de intencao:

- preparar entrada
- executar funcao ou rota
- verificar saida

### Nomeacao

Os testes devem deixar claro:

- o que esta sendo testado
- em qual situacao
- qual resultado e esperado

Exemplo:

- `deve redirecionar para login quando nao existir sessao`
- `deve criar denuncia com status pendente`
- `deve retornar 404 quando ONG nao for encontrada`

## 11. Critérios de aceite

A implantacao pode ser considerada concluida quando:

- houver configuracao de testes no projeto
- pelo menos as funcoes criticas da camada de dados estiverem cobertas
- os middlewares de autenticacao estiverem testados
- as principais rotas tiverem testes de sucesso e erro
- existir relatorio de cobertura
- o `npm test` executar sem falhas

## 12. Riscos e cuidados

### Risco 1: estado compartilhado em memoria

Impacto:

- testes podem interferir uns nos outros

Mitigacao:

- resetar dados antes de cada teste
- evitar dependencia da ordem de execucao

### Risco 2: rotas muito acopladas

Impacto:

- fica mais dificil testar sem subir a aplicacao inteira

Mitigacao:

- extrair funcoes puras para modulos auxiliares
- testar handlers com mocks

### Risco 3: cobertura enganosa

Impacto:

- testar apenas caminhos felizes nao protege o sistema

Mitigacao:

- priorizar erros, validacoes e bloqueios de acesso

## 13. Sequencia pratica de execucao

1. configurar Jest e scripts de teste
2. criar estrutura `tests/`
3. escrever testes da camada de dados
4. escrever testes dos middlewares
5. escrever testes das validacoes das rotas
6. adicionar testes de integracao com `supertest`
7. adicionar testes e2e com Playwright
8. medir cobertura
9. ajustar refatoracoes pequenas onde houver dificuldade
10. integrar testes no fluxo de entrega do projeto

## 14. Recomendacao final

A melhor ordem para este projeto e:

- primeiro garantir a camada de dados e os middlewares
- depois testar as validacoes das rotas
- por fim, cobrir o comportamento das paginas principais

Isso reduz retrabalho, porque a maior parte das regras do projeto esta concentrada nesses pontos.
