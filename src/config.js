import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnv(name, fallback = "") {
  const value = process.env[name];

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();

  return trimmedValue === "" ? fallback : trimmedValue;
}

// Prefixo padrão dos comandos.
export const PREFIX = "$";

// Emoji padrão usado nas respostas do bot.
export const BOT_EMOJI = "🤍 ";

// Nome do bot (mude se preferir).
export const BOT_NAME = "Alya Bot";

// Decoração padrão usada em linhas do menu.
export const BorderMenu = "┊";
export const IconMenu = "╎✰ۣۜۜ͜͡";

// LID do bot.
// Para obter o LID do bot, use o comando <prefixo>lid respondendo em cima de uma mensagem do número do bot
// Troque o <prefixo> pelo prefixo do bot (ex: /lid).
export const BOT_LID = "12345678901234567890@lid";

// LID do dono do bot.
// Para obter o LID do dono do bot, use o comando <prefixo>meu-lid
// Troque o <prefixo> pelo prefixo do bot (ex: /meu-lid).
export const OWNER_LID = "12345678901234567890@lid";

// Diretório raiz do projeto.
export const ROOT_DIR = path.resolve(__dirname, "..");

// Banner padrão do bot.
export const BOT_BANNER_PATH = path.join(
  ROOT_DIR,
  "assets",
  "images",
  "alya-bot-preview.png",
);

// Diretório dos comandos
export const COMMANDS_DIR = path.join(__dirname, "commands");

// Diretório de arquivos de mídia.
export const DATABASE_DIR = path.join(ROOT_DIR, "database");

// Diretório de arquivos de mídia.
export const ASSETS_DIR = path.join(ROOT_DIR, "assets");

// Diretório de arquivos temporários.
export const TEMP_DIR = path.join(ASSETS_DIR, "temp");

// Timeout em milissegundos por evento (evita banimento).
export const TIMEOUT_IN_MILLISECONDS_BY_EVENT = 500;

// URL base da API externa compatível com os comandos de downloads, IA e canvas.
// Configure pelo ambiente com ALYA_EXTERNAL_API_BASE_URL ou edite abaixo.
export const EXTERNAL_API_BASE_URL = readEnv("ALYA_EXTERNAL_API_BASE_URL");

// Token da API externa compatível com os comandos acima.
// Configure pelo ambiente com ALYA_EXTERNAL_API_TOKEN ou edite abaixo.
export const EXTERNAL_API_TOKEN = readEnv(
  "ALYA_EXTERNAL_API_TOKEN",
  "seu_token_aqui",
);

// URL base do serviço externo usado pelo comando gerar-link.
// Configure pelo ambiente com ALYA_LINK_UPLOAD_BASE_URL ou edite abaixo.
export const LINKER_BASE_URL = readEnv("ALYA_LINK_UPLOAD_BASE_URL");

// Chave do serviço externo usado pelo comando gerar-link.
// Configure pelo ambiente com ALYA_LINK_UPLOAD_API_KEY ou edite abaixo.
export const LINKER_API_KEY = readEnv(
  "ALYA_LINK_UPLOAD_API_KEY",
  "seu_token_aqui",
);

// Caso queira responder apenas um grupo específico,
// coloque o ID dele na configuração abaixo.
// Para saber o ID do grupo, use o comando <prefixo>get-group-id
// Troque o <prefixo> pelo prefixo do bot (ex: /get-group-id).
export const ONLY_GROUP_ID = "";

// Configuração para modo de desenvolvimento
// mude o valor para ( true ) sem os parênteses
// caso queira ver os logs de mensagens recebidas
export const DEVELOPER_MODE = false;

// Chave da OpenAI para o comando de suporte.
export const OPENAI_API_KEY = readEnv("OPENAI_API_KEY");
