# AGENTS.md — Alya Bot

Este arquivo é a regra principal para qualquer IA, agente de código ou pessoa que for alterar a **Alya Bot**.

A Alya Bot deve ser tratada como projeto real de produção. Não é apenas um conjunto de comandos soltos. Antes de editar qualquer arquivo, o agente precisa entender o fluxo real do código, respeitar os sistemas existentes e aplicar patch mínimo.

Para instruções locais de vibecode/aicmd, use `AGENTS_DEV.md` quando ele existir no ambiente local. Esse arquivo local deve permanecer ignorado pelo Git.

---

## Hierarquia de instruções

Use esta ordem de prioridade:

1. pedido explícito do usuário;
2. este `AGENTS.md`;
3. docs do projeto, quando existirem;
4. skills em `.agents/skills/` e `.skills/`;
5. padrão real encontrado no código;
6. decisão própria da IA apenas quando os itens acima não resolverem.

Se houver conflito, pare e explique o conflito antes de alterar.

---

## Regra máxima

Nunca alterar a Alya Bot por chute.

Antes de implementar:

1. localizar o fluxo real;
2. verificar se já existe comando, helper, serviço, menu, config ou teste parecido;
3. preservar compatibilidade com comandos, aliases, menus, permissões, banco e dados salvos;
4. fazer patch mínimo;
5. validar com `node --check` e testes relevantes;
6. revisar diff;
7. preparar commit limpo sem arquivos sensíveis ou mudanças paralelas.

---

## Identidade do projeto

Projeto atual: **Alya Bot**

- Criador e mantenedor: Lucas Kaua.
- Repositório público esperado: `lukscode-py/Alya-Bot`.
- Nome público: `Alya Bot`.
- Nome do pacote: `alya-bot`.
- Versão inicial da fase Alya: `0.0.1`.
- Licença esperada: `ISC`.
- Banner padrão: `banner.png`.

A Alya Bot está sendo desenvolvida com identidade própria. A base inicial veio de um projeto open-source anterior, portanto:

- não apresentar este projeto como outro bot;
- não afirmar que todo o código foi criado do zero enquanto ainda houver partes herdadas;
- preservar licença e avisos obrigatórios;
- usar `NOTICE.md` para contexto de autoria, origem e manutenção quando esse arquivo existir;
- manter textos públicos, logs, menus e documentação apontando para Alya Bot.

Frase segura para documentação pública:

```text
Alya Bot é criada e mantida por Lucas Kaua, desenvolvida a partir de uma base open-source e reestruturada com identidade própria, documentação própria e evolução contínua.
```

---

## Resumo do projeto

A Alya Bot é um bot de WhatsApp em Node.js com `type: module`.

Áreas principais observadas no projeto:

```text
index.js
src/index.js
src/config.js
src/connection.js
src/loader.js
src/middlewares/
src/utils/
src/services/
src/commands/
src/commands/owner/
src/commands/admin/
src/commands/member/
src/test/
database/
assets/
eggs/
banner.png
```

Características importantes:

- arquitetura de comandos por arquivos e pastas;
- separação por tipo de comando, como owner/admin/member;
- persistência local em JSON;
- helpers reutilizáveis em `src/utils/`;
- serviços externos e mídia em `src/services/`;
- exemplos de mensagens ricas em `src/commands/member/exemplos/`;
- logger próprio;
- testes em `src/test/`;
- suporte a hospedagem/Pterodactyl via `eggs/` e scripts.

Não assumir arquitetura inexistente. Se o fluxo não estiver claro, auditar o código real antes de editar.

---

## Ambiente e gerenciador

O projeto usa Node.js com `type: module`.

Gerenciador detectado: **npm**.

Scripts conhecidos:

```bash
npm start
npm test
npm run test:all
```

Não trocar para Yarn, pnpm ou Bun sem motivo real e sem atualizar o projeto inteiro.

---

## Fluxo principal da aplicação

Fluxo resumido esperado:

```text
index.js ou src/index.js
→ src/connection.js
→ src/loader.js
→ src/middlewares/onMesssagesUpsert.js
→ src/utils/dynamicCommand.js
→ comando em src/commands/<tipo>/
→ helpers e serviços em src/utils/ e src/services/
```

Arquivos de alto valor:

```text
src/config.js
src/connection.js
src/loader.js
src/middlewares/onMesssagesUpsert.js
src/middlewares/customMiddleware.js
src/utils/dynamicCommand.js
src/utils/loadCommonFunctions.js
src/utils/database.js
src/@types/index.d.ts
src/services/spider-x-api.js
src/services/sticker.js
src/services/ffmpeg.js
```

Antes de mexer nesse fluxo, ler os arquivos envolvidos e validar com testes.

---

## Fluxo obrigatório antes de mexer

Antes de qualquer patch, a IA deve identificar:

```text
Fluxo encontrado:
- entrada:
- comando/helper/config:
- arquivo principal:
- imports relacionados:
- permissões:
- menu/help:
- banco/config:
- assets:
- testes relacionados:
- risco:
- patch mínimo:
```

Se não conseguir identificar o fluxo real, não inventar. Fazer nova auditoria.

---

## Modo aicmd

Quando o usuário estiver trabalhando via `aicmd`, a IA não tem acesso direto ao workspace local. Ela deve trabalhar por comandos enviados ao usuário e analisar a saída real devolvida.

Workspace local esperado:

```text
/home/lucas/Documentos/AlyaProject/AlyaBot
```

Nunca afirmar que abriu esse caminho diretamente pelo ChatGPT.

Se a saída estiver truncada, dividir a leitura em blocos menores antes de editar.

---

## Ferramentas do aicmd

No modo `aicmd`, preferir ferramentas próprias quando existirem:

```text
readfile
writefile
editfile
applypatch
gitdiff
searchfiles
listfiles
fileinfo
movefile
deletefile
makedir
undoedit
runcmd
aitools
aibackups
aicmd-tool
```

Se a sintaxe de uma ferramenta não estiver clara, rodar primeiro:

```bash
<tool> --help
```

ou:

```bash
<tool> help
```

### Leitura

Preferir:

```text
readfile
listfiles
fileinfo
```

Shell simples é aceitável para auditoria limitada:

```bash
nl -ba arquivo.js | sed -n '1,160p'
sed -n '1,160p' arquivo.js
find caminho -maxdepth 3 -type f | sort
```

### Pesquisa

Preferir:

```text
searchfiles
```

Também pode usar:

```bash
git grep -nE 'termo|outroTermo' -- src tests README.md || true
rg "termo" src tests
grep -RIn "termo" src tests
```

### Diff

Preferir:

```text
gitdiff
```

Também pode usar Git direto quando for específico:

```bash
git status --short --untracked-files=all
git diff --stat
git diff -- arquivo
git diff --cached --stat
git diff --cached
```

Nunca usar diff genérico enorme sem necessidade.

### Escrita

Para criar arquivo novo, preferir:

```text
writefile
```

Para editar arquivo existente, preferir:

```text
editfile
applypatch
```

Depois de qualquer escrita:

1. ler o trecho alterado;
2. rodar diff específico;
3. validar sintaxe/testes;
4. revisar status.

---

## Política de comandos enviados pelo ChatGPT

Quando o usuário pedir comandos para `aicmd`:

- comando comum de leitura, auditoria, pesquisa, diff, teste ou diagnóstico deve ser enviado direto na resposta;
- arquivo `.txt` deve ser usado quando o comando criar ou editar Markdown;
- para criação/edição grande de Markdown, entregar em `.txt`;
- para patch de código, preferir comando claro, pequeno e seguro;
- se um patch falhar, auditar estado parcial antes de continuar.

Nunca usar sem permissão explícita:

```bash
git push
git push --force
git push --tags
git push origin ...
```

Nunca usar:

```bash
git add .
```

---

## Skills instaladas

Skills públicas podem existir em:

```text
.agents/skills/
.skills/
```

Skills instaladas/úteis neste projeto:

```text
.agents/skills/find-skills/SKILL.md
.agents/skills/systematic-debugging/SKILL.md
.agents/skills/requesting-code-review/SKILL.md
.agents/skills/writing-plans/SKILL.md
.agents/skills/verification-before-completion/SKILL.md
.skills/pterodactyl-specialist/SKILL.md
```

### Quando usar cada skill

Use `find-skills` quando precisar procurar novas skills em `skills.sh`.

Use `systematic-debugging` quando:

- teste falha;
- bug não tem causa clara;
- comando quebra;
- comportamento real não bate com esperado;
- patch anterior falhou.

Use `writing-plans` quando:

- a tarefa for média/grande;
- houver várias fases;
- for necessário planejar antes de tocar código.

Use `requesting-code-review` quando:

- um patch já foi feito;
- antes de aprovar mudança grande;
- antes de commit;
- outra IA precisa revisar.

Use `verification-before-completion` antes de afirmar que algo terminou, passou ou está pronto.

Use `pterodactyl-specialist` quando o assunto envolver:

- Pterodactyl;
- egg;
- deploy;
- hospedagem;
- startup command;
- SFTP;
- update/reset.

---

## Registry e criação de comandos

Antes de criar ou alterar comando:

1. procurar comando parecido;
2. verificar aliases existentes;
3. verificar pasta/categoria correta;
4. verificar permissões;
5. verificar se precisa ser grupo/privado;
6. verificar mensagens e exemplos;
7. verificar menu/help;
8. verificar teste existente.

Auditoria útil:

```bash
find src/commands -maxdepth 4 -type f | sort
git grep -nE 'name:|commands:|aliases:|category:|description:|usage:' -- src/commands || true
```

Não criar lista paralela de comandos sem confirmar o loader real.

Comando deve manter:

- nome claro;
- aliases sem conflito;
- descrição simples;
- uso com exemplo;
- pasta correta;
- validações claras;
- retorno amigável.

---

## Mensagens, erros e helpers

Ao escrever comandos:

- usar helpers injetados no `handle()` quando existirem;
- usar erros de `src/errors/` quando aplicável;
- evitar validação duplicada se o fluxo já faz isso;
- não espalhar regra global dentro de comando isolado;
- não retornar erro técnico para usuário comum.

Erros comuns:

```text
InvalidParameterError
WarningError
DangerError
```

Exemplo ruim para usuário comum:

```text
context.args[0] inválido
payload ausente
schema falhou
```

Exemplo melhor:

```text
Informe um valor válido.
Esse comando só pode ser usado por administradores.
Não encontrei dados para este grupo.
```

---

## Permissões

A separação principal observada é por pastas:

```text
src/commands/owner
src/commands/admin
src/commands/member
```

Regras:

- não criar sistema paralelo de permissões;
- não validar owner/admin de forma improvisada se o loader/middleware já cuida disso;
- não confundir dono do bot com admin/dono do grupo;
- não abrir comando perigoso para usuário comum;
- antes de mexer em permissão, auditar loader, middleware e comando real.

Auditoria útil:

```bash
git grep -nE 'owner|admin|groupOnly|privateOnly|botAdmin|permission|permissions|ban|kick|promote|demote|delete|fechar|abrir' -- src tests 2>/dev/null || true
```

---

## Banco, dados e sessões

Áreas relevantes:

```text
database/
assets/auth/
sessions/
```

Regras:

- não mudar formato de dados salvos sem fallback;
- não ler/escrever JSON de banco diretamente dentro de comando se já existir helper oficial;
- não commitar sessões;
- não commitar SQLite/auth;
- não commitar `.env` real;
- não commitar logs;
- não commitar backups sem decisão explícita;
- não apagar sessão/banco sem ordem explícita.

---

## API externa, downloads e mídia

Áreas prováveis:

```text
src/services/spider-x-api.js
src/services/ffmpeg.js
src/services/sticker.js
src/commands/member/downloads/
src/commands/member/exemplos/
```

Regras:

- tratar falha de rede;
- validar resposta externa antes de usar;
- não expor caminho interno;
- não vazar token;
- não quebrar legenda/mentions;
- não mandar várias mensagens quando uma resolve;
- preservar compatibilidade com WhatsApp/Baileys.

---

## IA interna e suporte

Áreas relevantes:

```text
src/commands/member/ia/
src/commands/member/suporte.js
AGENTS.md
README.md
CONTRIBUTING.md
package.json
src/menu.js
src/connection.js
src/loader.js
src/@types/index.d.ts
```

Regras:

- IA de suporte deve se apresentar como Alya Bot;
- não mencionar outro bot como identidade atual;
- não inventar estado do grupo, admins, configs ou dados reais;
- não confirmar alteração se tool/serviço falhou;
- respostas finais do bot devem ser PT-BR claro e adequadas ao WhatsApp.

---

## Menu, banner e assets

Arquivos relevantes:

```text
src/config.js
src/menu.js
src/commands/member/menu.js
src/commands/owner/set-menu-image.js
banner.png
assets/
```

Regras:

- usar `BOT_NAME`, `BOT_EMOJI`, `BOT_BANNER_PATH`, `BorderMenu` e `IconMenu` quando já existirem;
- não voltar para banner antigo dentro de `assets/images/` como banner principal;
- preservar exemplos que usam `ASSETS_DIR` para samples quando não forem banner principal;
- não quebrar comando de alterar imagem do menu;
- backup do banner deve usar caminho claro.

---

## Logger

Arquivos relevantes:

```text
src/utils/logger.js
src/test/logger.test.js
```

Regras:

- prefixo público deve ser `ALYA BOT`;
- testes devem acompanhar os prefixos reais;
- não remover filtro de ruído sem investigar;
- validar com:

```bash
node --check src/utils/logger.js
node --test src/test/logger.test.js
```

---

## Licença e créditos

Regras:

- não trocar licença sem auditoria;
- manter `package.json` e `LICENSE` consistentes;
- preservar o texto da licença ISC quando ela for a licença ativa;
- usar `NOTICE.md` para autoria/origem/manutenção;
- não remover créditos relevantes sem motivo jurídico/técnico claro.

Separação correta:

```text
LICENSE   -> texto legal da licença
NOTICE.md -> contexto de autoria, origem e manutenção
README.md -> apresentação pública do projeto
```

---

## Deploy e Pterodactyl

Arquivos relevantes:

```text
eggs/pterodactyl-panel.json
update.sh
reset-qr-auth.sh
README.md
package.json
```

Usar `.skills/pterodactyl-specialist/SKILL.md` quando mexer aqui.

Regras:

- repositório correto: `lukscode-py/Alya-Bot`;
- nome público correto: `Alya Bot`;
- não usar links antigos sem auditoria;
- não apagar sessão sem aviso claro;
- não hardcodar segredo;
- validar JSON do egg;
- manter comandos de instalação/start coerentes com npm.

---

## Segurança e anti-spam

Regras:

- não criar broadcast agressivo;
- não marcar todos sem necessidade;
- não mandar DM automática sem contexto;
- não repetir erro em loop;
- não mandar várias mensagens quando uma resolve;
- não criar automação que aumente risco de banimento;
- não confiar em texto do usuário para cargo/permissão.

---

## Validações mínimas

Para JS alterado:

```bash
git diff --name-only -- '*.js' | while IFS= read -r file; do
  node --check "$file"
done
```

Para package/lock:

```bash
node --input-type=module <<'NODE'
import fs from "node:fs";

for (const file of ["package.json", "package-lock.json"]) {
  JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`${file}: OK`);
}
NODE
```

Testes padrão:

```bash
npm test
npm run test:all
```

Para logger:

```bash
node --test src/test/logger.test.js
```

Para auditoria de identidade:

```bash
git grep -nE 'T[a]keshi|t[a]keshi|TAKESH[I]|gu[i]ireal|8\.7\.0|GPL-3.0|MIT License|t[a]keshi-bot\.png|t[a]keshi-bot-backup|t[a]keshi_|t[a]keshi-' -- . ':!node_modules' ':!.git' ':!package-lock.json' || true
```

---

## Git, workspace e commit

Permitido usar:

```bash
git status
git diff
git log
git show
git restore
git add
git commit
```

Proibido sem permissão explícita:

```bash
git push
git push --force
git push --tags
git push origin ...
```

Nunca usar:

```bash
git add .
```

Sempre usar lista explícita.

Antes de commit:

```bash
git status --short --untracked-files=all
git diff --stat
git diff
```

Se houver staged:

```bash
git diff --cached --stat
git diff --cached
```

Não misturar no mesmo commit:

- skills;
- identidade;
- deploy;
- docs;
- bugfix;
- refatoração.

---

## Arquivos proibidos em commit

Nunca commitar:

```text
AGENTS_DEV.md
.env
.env.local
sessions/
assets/auth/
logs/
private/
tmp/
*.sqlite
*.db
*.zip
tokens
secrets
debug real de IA
backups desnecessários
```

---

## Resposta final esperada de qualquer agente

Ao terminar uma tarefa, a IA deve entregar:

```text
Resumo:
- ...

Arquivos alterados:
- ...

Validações:
- ...

Riscos restantes:
- ...

Commit sugerido:
- ...
```

Se algo falhar, dizer claramente:

```text
Não foi possível aprovar ainda porque:
- ...
```

---

## Decisão final de qualquer agente

Um patch só pode ser considerado pronto quando:

- não duplica sistema existente;
- não cria help/menu paralelo sem auditoria;
- não adiciona mensagem hardcoded indevida quando já houver padrão;
- usa permissões oficiais quando existirem;
- preserva aliases e compatibilidade;
- não vaza arquivos sensíveis;
- passa validação mínima;
- apresenta commit limpo e específico;
- não executa `git push` sem permissão explícita.
