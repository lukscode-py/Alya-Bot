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
// - Em Termux, prefira modelos pequenos e limite threads/contexto para evitar crash.
// - Comandos específicos, como gptlocal/openrouter/openai-comp, ignoram o defaultProvider.
// - O provedor local não precisa de key, mas precisa do Ollama instalado e do modelo baixado.
// - Provedores de API só funcionam quando a key correspondente estiver configurada.
//
// Exemplos de apiKeys:
// apiKeys: [readEnv("GEMINI_API_KEY")]
// apiKeys: ["key_1", "key_2", "key_3"]
//
export const AI_CONFIG = {
  ai: {
    // Liga/desliga todo o serviço central de IA.
    // Se ficar false, comandos de IA retornam erro controlado.
    enabled: true,

    // Padrão recomendado para Termux/Android:
    // usa IA local primeiro para não depender de API externa.
    // Esse provedor é usado por comandos genéricos quando eles não escolhem um provider fixo.
    defaultProvider: "local",

    // Ordem de tentativa quando o comando permitir fallback.
    // O Alya tenta o provider principal e, se falhar, passa para os próximos.
    // Não coloque "local" aqui se quiser evitar que APIs caiam automaticamente para o celular.
    fallbackProviders: [
      "openrouter",
      "openaiCompatible",
      "openai",
      "deepseek",
      "gemini",
    ],

    // Lista de providers que podem ser carregados pelo serviço central.
    // Mesmo ativo aqui, o provider ainda precisa estar enabled dentro da própria configuração.
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
      // Gemini usa API própria do Google.
      // Configure GEMINI_API_KEY no ambiente para funcionar.
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
      // Provider oficial da OpenAI.
      // Fica desativado por padrão para não exigir key em instalação nova.
      // Ative apenas se configurar OPENAI_API_KEY.
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
      // Provider oficial da DeepSeek.
      // Fica desativado por padrão; ative quando configurar DEEPSEEK_API_KEY.
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
      // OpenRouter usa formato compatível com OpenAI.
      // Bom para acessar vários modelos por uma única API.
      // O comando $openrouter força este provider diretamente.
      enabled: true,
      kind: "openaiCompatible",
      name: "OpenRouter",
      baseURL: "https://openrouter.ai/api/v1",
      // Pode trocar pelo ambiente:
      // OPENROUTER_MODEL="meta-llama/llama-3.1-8b-instruct"
      defaultModel: readEnv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
      allowedModels: [],
      // Nunca coloque sua key direto aqui se for publicar o projeto.
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
      // Provider genérico para qualquer API que siga o padrão /v1/chat/completions.
      // Exemplos: proxies próprios, gateways, OpenRouter alternativo ou APIs self-hosted.
      // O comando $openai-comp força este provider diretamente.
      enabled: true,
      kind: "openaiCompatible",
      name: "OpenAI Compatible",
      // Configure via ambiente para não editar código:
      // ALYA_OPENAI_COMPATIBLE_BASE_URL="https://sua-api.com/v1"
      baseURL: readEnv("ALYA_OPENAI_COMPATIBLE_BASE_URL", "https://api.exemplo.com/v1"),
      // Configure via ambiente:
      // ALYA_OPENAI_COMPATIBLE_MODEL="nome-do-modelo"
      defaultModel: readEnv("ALYA_OPENAI_COMPATIBLE_MODEL", "modelo-exemplo"),
      allowedModels: [],
      // Configure via ambiente:
      // ALYA_OPENAI_COMPATIBLE_API_KEY="sua_key"
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
    // Configuração da IA local usada pelo comando $gptlocal e pelo defaultProvider local.
    enabled: true,
    kind: "local",
    // Runtime local usado para rodar modelo no dispositivo.
    // Atualmente o Alya Bot usa Ollama.
    provider: "ollama",
    // Modelo padrão leve para Termux.
    // Troque para qwen2.5:1.5b, llama3.2:1b ou gemma3:1b se o dispositivo aguentar.
    selectedModel: "qwen2.5:0.5b",
    // API HTTP local do Ollama.
    // Em Termux, normalmente fica em 127.0.0.1:11434.
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
    // Use isso só se o comando "ollama" não estiver disponível globalmente.
    runtimePath: "",
    // Se true, o bot inicia "ollama serve" quando a API local não estiver ativa.
    autoStartServer: true,
    // Perfil leve para Termux/celular fraco.
    // Aumentar threads/contextSize/maxTokens melhora capacidade, mas consome mais RAM/CPU.
    threads: 2,
    // Contexto menor evita travamentos em aparelhos fracos.
    contextSize: 1024,
    // Temperatura menor deixa respostas mais estáveis.
    temperature: 0.6,
    topP: 0.85,
    topK: 30,
    repeatPenalty: 1.12,
    // Limite de tokens da resposta local.
    // Em celular fraco, valores altos deixam a resposta lenta e podem travar.
    maxTokens: 256,
    // 0 força CPU. Em Termux/Android, GPU geralmente não é usada pelo Ollama.
    gpuLayers: 0,
    // Timeout maior porque modelo local em CPU pode demorar para responder.
    timeout: 180000,
  },
};

// =====================================================
// CONFIGURAÇÃO LOCAL DE REMOÇÃO DE FUNDO / RMBG
// =====================================================
//
// Quando enabled=true, o comando removebg/rmbg usa IA local no lugar da API externa.
// O runtime usa Python + TensorFlow Lite/LiteRT para executar o modelo .tflite.
// Fluxo de inicialização:
// 1. Verifica se Python e runtime TFLite/LiteRT existem.
// 2. Se faltar ambiente, pergunta no terminal se deseja preparar agora.
// 3. Se o modelo não existir, pergunta no terminal se deseja baixar agora.
// 4. Executa o modelo local e retorna PNG com fundo transparente.
//
// Termux:
// - tenta instalar python e libs básicas via pkg.
// - cria ambiente isolado em assets/ai/runtime/rmbg-python quando possível.
//
// Windows/Linux:
// - usa Python já instalado.
// - tenta criar venv e instalar pillow/numpy/tflite-runtime.
// - se tflite-runtime não estiver disponível, tenta ai-edge-litert e tensorflow.
export const RMBG_CONFIG = {
  enabled: true,
  provider: "local-tflite",

  model: {
    id: "u2net_fp16",
    name: "U2Net FP16 RMBG",
    fileName: "u2net_fp16_rmbg.tflite",
    url: "https://github.com/lukscode-py/models_ai/raw/refs/heads/main/u2net_fp16_rmbg.tflite",
    directory: path.join(ROOT_DIR, "assets", "ai", "models", "rmbg"),
    path: path.join(
      ROOT_DIR,
      "assets",
      "ai",
      "models",
      "rmbg",
      "u2net_fp16_rmbg.tflite",
    ),
  },

  runtime: {
    autoPrepare: true,
    // false = pergunta s/n na inicialização, igual ao provedor local Ollama.
    // true = instala/prepara sem perguntar.
    autoInstallRuntime: false,
    autoDownloadModel: false,
    askBeforePrepare: true,
    askBeforeDownload: true,
    pythonPath: readEnv("ALYA_RMBG_PYTHON_PATH"),
    venvDir: path.join(ROOT_DIR, "assets", "ai", "runtime", "rmbg-python"),
    scriptPath: path.join(ROOT_DIR, "src", "scripts", "rmbg_tflite.py"),
    timeout: 600000,
    // No Termux, pacotes com build nativo disponível devem ser instalados via pkg.
    // Isso evita compilar numpy/pillow via pip no Android.
    termuxPackages: [
      "python",
      "python-numpy",
      "python-pillow",
      "clang",
      "libjpeg-turbo",
      "zlib",
      "freetype",
      "libpng",
      "openblas",
    ],
    // Usado em Windows/Linux. No Termux, esses pacotes são pulados e instalados via pkg.
    pipPackages: ["pillow", "numpy"],
    // Interpretadores TFLite/LiteRT ficam como fallback via pip quando não houver pacote nativo.
    interpreterPackages: ["tflite-runtime", "ai-edge-litert", "tensorflow"],
  },
};
