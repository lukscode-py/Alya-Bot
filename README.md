# 🤍 Alya Bot

> Bot de WhatsApp multifuncional em Node.js, criado e mantido por **Lucas Kaua**.

## Projeto

A **Alya Bot** é uma base de bot de WhatsApp com comandos organizados por categoria, suporte a mídias, recursos administrativos, mensagens automáticas, menus e utilitários para grupos.

O projeto está em fase de reestruturação de identidade e código. A base inicial veio de um projeto open-source anterior, mas a Alya está sendo evoluída com identidade própria, documentação própria, organização própria e manutenção própria.

Informações principais:

- **Nome:** Alya Bot
- **Criador e mantenedor:** Lucas Kaua
- **Pacote:** `alya-bot`
- **Versão inicial da fase Alya:** `0.0.1`
- **Licença:** ISC
- **Runtime:** Node.js com ES Modules

## Aviso

Este projeto não possui vínculo oficial com WhatsApp, Meta, Baileys ou qualquer serviço externo usado por comandos opcionais.

O uso é responsabilidade de quem executa o bot. Respeite os termos de uso do WhatsApp, as regras dos grupos e a legislação aplicável.

## Requisitos

- Node.js compatível com o projeto
- npm
- Git
- FFmpeg
- Acesso a um número de WhatsApp para pareamento
- Terminal com permissão para ler e gravar arquivos do projeto

## Instalação no Termux

Atualize os pacotes e instale as dependências principais:

```sh
pkg update -y
pkg upgrade -y
pkg install git nodejs-lts ffmpeg -y
```

Libere o acesso ao armazenamento:

```sh
termux-setup-storage
```

Clone o repositório:

```sh
git clone https://github.com/lukscode-py/Alya-Bot.git
cd Alya-Bot
```

Instale as dependências:

```sh
npm install
```

Inicie o bot:

```sh
npm start
```

Na primeira execução, informe o número do WhatsApp quando o terminal pedir e conecte usando o código de pareamento exibido.

## Instalação no Windows

Instale:

- Git
- Node.js
- FFmpeg

Depois abra o terminal na pasta onde deseja deixar o projeto e execute:

```sh
git clone https://github.com/lukscode-py/Alya-Bot.git
cd Alya-Bot
npm install
npm start
```

## Instalação em VPS Debian/Ubuntu

Instale dependências básicas:

```sh
sudo apt update
sudo apt install git curl ffmpeg -y
```

Instale Node.js conforme o método de sua preferência. Um método comum é usar NVM.

Depois clone e instale:

```sh
git clone https://github.com/lukscode-py/Alya-Bot.git
cd Alya-Bot
npm install
npm start
```

Para manter rodando em segundo plano, use um gerenciador de processos como PM2:

```sh
npm install pm2 -g
pm2 start npm --name "Alya-Bot" -- start
```

## Configuração principal

As configurações principais ficam em:

```text
src/config.js
```

Exemplo básico:

```js
export const PREFIX = "/";
export const BOT_EMOJI = "🤍";
export const BOT_NAME = "Alya Bot";

export const BOT_LID = "12345678901234567890@lid";
export const OWNER_LID = "12345678901234567890@lid";
```

Para obter o LID do bot, use o comando de LID respondendo a uma mensagem enviada pelo próprio bot.

Para obter o LID do dono, use o comando de identificação do próprio usuário no WhatsApp.

## APIs e serviços externos

Alguns comandos podem depender de serviços externos, tokens ou APIs configuradas no projeto.

A Alya Bot não declara nenhum serviço externo como propriedade do projeto. Configure apenas serviços que você realmente usa, com suas próprias credenciais, respeitando os termos de cada plataforma.

Procure pelas variáveis de configuração em:

```text
src/config.js
database/config.json
```

## Comandos e funcionalidades

A Alya possui comandos separados por categoria:

```text
src/commands/owner/
src/commands/admin/
src/commands/member/
```

Resumo geral:

| Categoria | Exemplos de recursos |
|---|---|
| Dono | Configuração do bot, menu e controle global |
| Admin | Administração de grupo, proteções, mensagens automáticas |
| Membro | Figurinhas, downloads, mídia, diversão, exemplos e utilidades |

Para ver os comandos reais disponíveis, consulte a pasta `src/commands/` ou use o menu do bot.

## Auto responder

O auto responder usa o arquivo:

```text
database/auto-responder.json
```

Exemplo:

```json
[
  {
    "match": "Oi",
    "answer": "Olá, tudo bem?"
  },
  {
    "match": "Qual seu nome",
    "answer": "Meu nome é Alya Bot"
  }
]
```

## Menu do bot

O menu principal fica em:

```text
src/menu.js
```

## Mensagens de boas-vindas e saída

As mensagens de entrada e saída de membros ficam em:

```text
src/messages.js
```

## Estrutura de pastas

```text
.
├── AGENTS.md
├── README.md
├── LICENSE
├── NOTICE.md
├── package.json
├── database/
├── eggs/
├── src/
│   ├── commands/
│   │   ├── admin/
│   │   ├── member/
│   │   └── owner/
│   ├── errors/
│   ├── middlewares/
│   ├── services/
│   ├── test/
│   ├── utils/
│   ├── config.js
│   ├── connection.js
│   ├── index.js
│   ├── loader.js
│   ├── menu.js
│   └── messages.js
├── reset-qr-auth.sh
└── update.sh
```

## Atualizar o bot

Use:

```sh
bash update.sh
```

Antes de atualizar, confira se você não tem alterações locais importantes sem commit ou backup.

## Resetar autenticação

Se a sessão do WhatsApp quebrar ou precisar parear novamente:

```sh
bash reset-qr-auth.sh
```

Depois remova o dispositivo antigo no WhatsApp e conecte novamente.

## Testes

Rodar teste principal:

```sh
npm test
```

Rodar todos os testes:

```sh
npm run test:all
```

## Problemas comuns

### O bot não reconhece alterações no config

Verifique se você está executando o projeto certo. É comum ter duas cópias do bot, por exemplo uma clonada por Git e outra baixada como ZIP.

Configure e execute apenas uma cópia.

### Erro de permissão no Termux

Rode:

```sh
termux-setup-storage
```

Depois aceite a permissão no Android.

### Falha de sessão ou pareamento

Rode:

```sh
bash reset-qr-auth.sh
```

Depois conecte novamente o número em “dispositivos conectados” no WhatsApp.

## Contribuições

As contribuições externas diretas estão fechadas por enquanto.

Você pode estudar o código, adaptar para uso pessoal e criar forks respeitando a licença do projeto.

## Licença

Este projeto está licenciado sob a licença **ISC**.

Preserve os avisos de licença e autoria mantidos em:

```text
LICENSE
NOTICE.md
```

## Manutenção

Alya Bot é criada e mantida por **Lucas Kaua**.
