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

// Nome exibido no menu.
export const OWNER_NAME = "Dono";

// Decoração padrão usada em linhas do menu.
export const BorderMenu = "┊";
export const IconMenu = "🤍 ";

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


// =====================================================
// CONFIGURAÇÃO CENTRAL DE INTELIGÊNCIA ARTIFICIAL
// =====================================================
//
// Dicas:
// - enabled: true ativa o serviço central de IA.
// - activeProviders define quais provedores podem ser usados.
// - defaultProvider é o provedor usado quando nenhum comando escolher um.
// - fallbackProviders são usados quando o provedor principal falhar.
// - apiKeys aceita várias keys para rotação inteligente.
// - Use readEnv("NOME_DA_ENV") para não colocar key direto no código.
// - Se quiser key direta, coloque string normal dentro do array apiKeys.
// - provider-state fica em database/ai/provider-state.json e salva apenas hashes.
// - IA local usa Ollama em http://127.0.0.1:11434.
//
// Exemplos de apiKeys:
// apiKeys: [readEnv("GEMINI_API_KEY")]
// apiKeys: ["key_1", "key_2", "key_3"]
//
export const AI_CONFIG = {
  ai: {
    enabled: true,

    // Padrão recomendado para Termux/Android:
    // usa IA local primeiro para não depender de API externa.
    defaultProvider: "local",

    fallbackProviders: [
      "openrouter",
      "openaiCompatible",
      "openai",
      "deepseek",
      "gemini",
    ],

    activeProviders: [
      "local",
      "gemini",
      "openrouter",
      "openai",
      "deepseek",
      "openaiCompatible",
      "local",
    ],
  },

  providers: {
    gemini: {
      enabled: true,
      kind: "gemini",
      name: "Gemini",
      defaultModel: "gemini-3.1-flash-lite-preview",
      allowedModels: [
      ],
      apiKeys: [readEnv("GEMINI_API_KEY")],
      timeout: 30000,
      retries: 1,
      cooldownMs: 3600000,
      rotationStrategy: "last-working-first",
      priority: 10,
      fallbackProviders: ["openrouter", "openaiCompatible"],
    },

    openai: {
      enabled: false,
      kind: "openaiCompatible",
      name: "OpenAI",
      baseURL: "https://api.openai.com/v1",
      defaultModel: "gpt-4o-mini",
      allowedModels: ["gpt-4o-mini", "gpt-4.1-mini", "gpt-5.4-mini"],
      apiKeys: [readEnv("OPENAI_API_KEY")],
      timeout: 30000,
      retries: 1,
      cooldownMs: 3600000,
      rotationStrategy: "last-working-first",
      priority: 20,
      fallbackProviders: ["openrouter", "gemini"],
    },

    deepseek: {
      enabled: false,
      kind: "openaiCompatible",
      name: "DeepSeek",
      baseURL: "https://api.deepseek.com/v1",
      defaultModel: "deepseek-chat",
      allowedModels: ["deepseek-chat", "deepseek-reasoner"],
      apiKeys: [readEnv("DEEPSEEK_API_KEY")],
      timeout: 30000,
      retries: 1,
      cooldownMs: 3600000,
      rotationStrategy: "last-working-first",
      priority: 30,
      fallbackProviders: ["openrouter", "gemini"],
    },

    openrouter: {
      enabled: true,
      kind: "openaiCompatible",
      name: "OpenRouter",
      baseURL: "https://openrouter.ai/api/v1",
      defaultModel: readEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
      allowedModels: [],
      apiKeys: [readEnv("OPENROUTER_API_KEY")],
      timeout: 60000,
      retries: 1,
      cooldownMs: 3600000,
      rotationStrategy: "last-working-first",
      priority: 40,
      fallbackProviders: ["gemini", "openaiCompatible"],
      headers: {
        "HTTP-Referer": "https://alya.local",
        "X-Title": "Alya Bot",
      },
    },

    openaiCompatible: {
      enabled: true,
      kind: "openaiCompatible",
      name: "OpenAI Compatible",
      baseURL: readEnv("ALYA_OPENAI_COMPATIBLE_BASE_URL", "https://api.exemplo.com/v1"),
      defaultModel: readEnv("ALYA_OPENAI_COMPATIBLE_MODEL", "modelo-exemplo"),
      allowedModels: [],
      apiKeys: [readEnv("ALYA_OPENAI_COMPATIBLE_API_KEY")],
      timeout: 60000,
      retries: 1,
      cooldownMs: 3600000,
      rotationStrategy: "last-working-first",
      priority: 50,
      fallbackProviders: ["gemini"],
    },
  },

  local: {
    enabled: true,
    kind: "local",
    provider: "ollama",
    selectedModel: "qwen2.5:0.5b",
    baseUrl: "http://127.0.0.1:11434",
    host: "127.0.0.1:11434",
    // Se true, tenta instalar o Ollama automaticamente sem perguntar.
    // Útil para ambientes sem terminal interativo, mas por padrão fica false.
    autoInstallRuntime: false,

    // Se true, tenta baixar o modelo Ollama selecionado automaticamente sem perguntar.
    // Útil para testes em terminal não interativo.
    autoDownloadModel: false,

    // Se true, quando possível, pergunta antes de baixar modelo.
    askBeforeDownload: true,
    // Caminho opcional do executável ollama. Vazio usa o PATH.
    runtimePath: "",
    // Se true, o bot inicia "ollama serve" quando a API local não estiver ativa.
    autoStartServer: true,
    // Perfil leve para Termux/celular fraco.
    threads: 2,
    contextSize: 1024,
    temperature: 0.6,
    topP: 0.85,
    topK: 30,
    repeatPenalty: 1.12,
    maxTokens: 256,
    gpuLayers: 0,
    timeout: 180000,
  },
};
