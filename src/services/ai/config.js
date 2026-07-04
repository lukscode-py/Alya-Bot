import fs from "node:fs";
import path from "node:path";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (!isPlainObject(base)) {
    return structuredClone(override);
  }

  const output = structuredClone(base);

  if (!isPlainObject(override)) {
    return output;
  }

  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) {
      output[key] = [...value];
      continue;
    }

    if (isPlainObject(value)) {
      output[key] = deepMerge(output[key] || {}, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

export function getDefaultAiConfig() {
  return {
    ai: {
      enabled: false,
      defaultProvider: "gemini",
      fallbackProviders: ["openrouter", "openai", "deepseek", "openaiCompatible", "local"],
      activeProviders: ["gemini", "openrouter", "openai", "deepseek", "openaiCompatible", "local"],
    },
    providers: {
      gemini: {
        enabled: false,
        kind: "gemini",
        name: "Gemini",
        defaultModel: "gemini-1.5-flash",
        allowedModels: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
        apiKeys: [],
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
        allowedModels: [],
        apiKeys: [],
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
        allowedModels: [],
        apiKeys: [],
        timeout: 30000,
        retries: 1,
        cooldownMs: 3600000,
        rotationStrategy: "last-working-first",
        priority: 30,
        fallbackProviders: ["openrouter", "gemini"],
      },
      openrouter: {
        enabled: false,
        kind: "openaiCompatible",
        name: "OpenRouter",
        baseURL: "https://openrouter.ai/api/v1",
        defaultModel: "openai/gpt-4o-mini",
        allowedModels: [],
        apiKeys: [],
        timeout: 30000,
        retries: 1,
        cooldownMs: 3600000,
        rotationStrategy: "last-working-first",
        priority: 40,
        fallbackProviders: ["gemini", "openaiCompatible"],
        headers: {},
      },
      openaiCompatible: {
        enabled: false,
        kind: "openaiCompatible",
        name: "OpenAI Compatible",
        baseURL: "",
        defaultModel: "",
        allowedModels: [],
        apiKeys: [],
        timeout: 30000,
        retries: 1,
        cooldownMs: 3600000,
        rotationStrategy: "last-working-first",
        priority: 50,
        fallbackProviders: ["gemini"],
        headers: {},
      },
    },
    local: {
      enabled: false,
      kind: "local",
      provider: "llama.cpp",
      selectedModel: "qwen-2.5-0.5b",
      autoDownloadModel: false,
      autoInstallRuntime: false,
      askBeforeDownload: true,
      runtimePath: "",
      threads: 4,
      contextSize: 2048,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      repeatPenalty: 1.1,
      maxTokens: 512,
      gpuLayers: 0,
      timeout: 120000,
    },
  };
}

export function readJsonFile(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();

  if (!raw) {
    return fallback;
  }

  return JSON.parse(raw);
}

export function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function loadAiConfig(paths, overrideConfig = null) {
  const defaultConfig = getDefaultAiConfig();

  if (overrideConfig) {
    return deepMerge(defaultConfig, overrideConfig);
  }

  const config = readJsonFile(paths.configPath, null);

  if (!config) {
    return defaultConfig;
  }

  return deepMerge(defaultConfig, config);
}

export function loadModelsRegistry(paths) {
  return readJsonFile(paths.modelsRegistryPath, []);
}
