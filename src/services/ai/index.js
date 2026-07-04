import { ROOT_DIR } from "../../config.js";
import fs from "node:fs";
import { infoLog, warningLog } from "../../utils/logger.js";
import { loadAiConfig, loadModelsRegistry } from "./config.js";
import { AI_ERROR_CODES, buildAiErrorObject, createAiError } from "./errors.js";
import { classifyProviderError, hashApiKey, orderKeysForProvider, resolveApiKeys } from "./key-rotation.js";
import { detectLocalEnvironment, downloadLocalModel } from "./local-runtime.js";
import { buildAiPaths } from "./paths.js";
import { requestGemini } from "./providers/gemini.js";
import { requestLocalLlama } from "./providers/local-llama.js";
import { requestOpenAiCompatible } from "./providers/openai-compatible.js";
import { AiProviderState } from "./state.js";

const DEFAULT_ADAPTERS = {
  gemini: requestGemini,
  openaiCompatible: requestOpenAiCompatible,
  local: requestLocalLlama,
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getProviderKind(providerName, providerConfig) {
  if (providerName === "local") {
    return "local";
  }

  return providerConfig?.kind || providerName;
}

function getAllowedModels(providerConfig) {
  return Array.isArray(providerConfig?.allowedModels) ? providerConfig.allowedModels : [];
}

function validateModel(providerName, providerConfig, model) {
  const allowedModels = getAllowedModels(providerConfig);

  if (allowedModels.length && model && !allowedModels.includes(model)) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      `Modelo ${model} não está permitido para o provedor ${providerName}.`,
      { provider: providerName, model },
    );
  }
}

function getProviderErrorMessage(providerName, errors) {
  const summary = errors
    .map((item) => `${item.provider}: ${item.error?.error || item.error?.message || "erro"}`)
    .join(" | ");

  return `Nenhum provedor de IA funcionou para ${providerName}. ${summary}`;
}

export class AiService {
  constructor({ rootDir = ROOT_DIR, config = null, adapters = null } = {}) {
    this.rootDir = rootDir;
    this.paths = buildAiPaths(rootDir);
    this.overrideConfig = config;
    this.adapters = adapters || DEFAULT_ADAPTERS;
    this.stateManager = new AiProviderState(this.paths);
    this.config = null;
    this.registry = [];
    this.initialized = false;
  }

  loadRuntimeData() {
    this.config = loadAiConfig(this.paths, this.overrideConfig);
    this.registry = loadModelsRegistry(this.paths);
    this.stateManager.load();

    return {
      config: this.config,
      registry: this.registry,
      state: this.stateManager.state,
    };
  }

  async initialize() {
    this.loadRuntimeData();

    if (!this.config.ai.enabled) {
      infoLog("Serviço de IA desativado em src/config.js.");
      this.initialized = true;
      return {
        ok: true,
        enabled: false,
      };
    }

    const activeProviders = this.getActiveProviders();

    if (this.config.local?.enabled && activeProviders.includes("local")) {
      const localStatus = this.getLocalStatus();

      if (!localStatus.modelInstalled) {
        warningLog(
          `IA local ativa, mas o modelo ${this.config.local.selectedModel} não foi encontrado. O provedor local ficará indisponível até instalar o modelo.`,
        );
      }
    }

    infoLog(`Serviço de IA inicializado. Provedores ativos: ${activeProviders.join(", ") || "nenhum"}.`);
    this.initialized = true;

    return {
      ok: true,
      enabled: true,
      activeProviders,
    };
  }

  reloadConfig() {
    this.initialized = false;
    return this.loadRuntimeData();
  }

  getActiveProviders() {
    if (!this.config) {
      this.loadRuntimeData();
    }

    const activeProviders = this.config.ai.activeProviders || [];
    return activeProviders.filter((providerName) => {
      const providerConfig = this.getProviderConfig(providerName);
      return Boolean(providerConfig?.enabled);
    });
  }

  getProviderConfig(providerName) {
    if (!this.config) {
      this.loadRuntimeData();
    }

    if (providerName === "local") {
      return {
        ...this.config.local,
        kind: "local",
        name: "llama.cpp",
      };
    }

    return this.config.providers?.[providerName] || null;
  }

  getProviderOrder(options = {}) {
    if (!this.config) {
      this.loadRuntimeData();
    }

    if (options.provider) {
      const providerConfig = this.getProviderConfig(options.provider);
      const providerFallbacks =
        options.allowProviderFallback === false
          ? []
          : providerConfig?.fallbackProviders || this.config.ai.fallbackProviders || [];

      return unique([options.provider, ...providerFallbacks]);
    }

    return unique([
      this.config.ai.defaultProvider,
      ...(this.config.ai.fallbackProviders || []),
    ]);
  }

  async request(options = {}) {
    if (!this.config || !this.initialized) {
      this.loadRuntimeData();
    }

    if (!this.config.ai.enabled) {
      return buildAiErrorObject(
        createAiError(
          AI_ERROR_CODES.AI_SERVICE_DISABLED,
          "O serviço de IA está desativado nas configurações.",
        ),
      );
    }

    const providerOrder = this.getProviderOrder(options);
    const errors = [];

    for (const providerName of providerOrder) {
      const startedAt = Date.now();

      try {
        const result = await this.requestWithProvider(providerName, options);
        const elapsedMs = Date.now() - startedAt;

        infoLog(
          `[AI] provider=${providerName} model=${result.model} elapsed=${elapsedMs}ms fallback=${providerName !== providerOrder[0]}`,
        );

        return {
          ok: true,
          provider: providerName,
          model: result.model,
          text: result.text,
          data: result.data,
          usage: result.usage,
          finishReason: result.finishReason,
          elapsedMs,
          fallback: providerName !== providerOrder[0],
        };
      } catch (error) {
        const normalizedError = buildAiErrorObject(error);
        errors.push({
          provider: providerName,
          error: normalizedError,
        });

        warningLog(
          `[AI] falha provider=${providerName} error=${normalizedError.error} message=${normalizedError.message}`,
        );
      }
    }

    return {
      ok: false,
      error: AI_ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
      message: getProviderErrorMessage(providerOrder[0], errors),
      attempts: errors,
    };
  }

  async chat(messages, options = {}) {
    return this.request({
      ...options,
      messages,
    });
  }

  async requestWithProvider(providerName, options = {}) {
    const providerConfig = this.getProviderConfig(providerName);

    if (!providerConfig) {
      throw createAiError(
        AI_ERROR_CODES.AI_PROVIDER_NOT_FOUND,
        `Provedor de IA ${providerName} não encontrado.`,
        { provider: providerName },
      );
    }

    if (!providerConfig.enabled) {
      throw createAiError(
        AI_ERROR_CODES.AI_PROVIDER_DISABLED,
        `Provedor de IA ${providerName} está desativado.`,
        { provider: providerName },
      );
    }

    const providerKind = getProviderKind(providerName, providerConfig);
    const adapter = this.adapters[providerKind];

    if (!adapter) {
      throw createAiError(
        AI_ERROR_CODES.AI_PROVIDER_NOT_FOUND,
        `Adaptador de IA ${providerKind} não encontrado.`,
        { provider: providerName },
      );
    }

    const model = options.model || providerConfig.defaultModel || providerConfig.selectedModel;

    validateModel(providerName, providerConfig, model);

    if (providerKind === "local") {
      const result = await adapter({
        providerName,
        providerConfig,
        model,
        messages: options.messages || [],
        options,
        paths: this.paths,
        registry: this.registry,
      });

      return {
        ...result,
        model,
      };
    }

    const apiKeys = resolveApiKeys(providerConfig.apiKeys);

    if (!apiKeys.length) {
      throw createAiError(
        AI_ERROR_CODES.AI_NO_VALID_API_KEY,
        `Nenhuma API key válida disponível para o provedor ${providerName}.`,
        { provider: providerName, model },
      );
    }

    const providerState = this.stateManager.getProviderState(providerName);
    const orderedKeys = orderKeysForProvider(apiKeys, providerState);

    if (!orderedKeys.length) {
      throw createAiError(
        AI_ERROR_CODES.AI_NO_VALID_API_KEY,
        `Nenhuma API key disponível fora de cooldown para o provedor ${providerName}.`,
        { provider: providerName, model },
      );
    }

    let lastError = null;

    for (const keyInfo of orderedKeys) {
      try {
        const result = await adapter({
          providerName,
          providerConfig,
          apiKey: keyInfo.apiKey,
          model,
          messages: options.messages || [],
          options,
        });

        this.stateManager.markSuccess(providerName, keyInfo.hash);

        return {
          ...result,
          model,
        };
      } catch (error) {
        const classification = classifyProviderError(error);
        const safeError = createAiError(
          classification.error,
          classification.message,
          {
            provider: providerName,
            model,
            status: classification.status,
            retryable: classification.retryable,
          },
        );

        this.stateManager.markFailure(
          providerName,
          keyInfo.hash,
          classification,
          providerConfig.cooldownMs,
        );

        warningLog(
          `[AI] key_hash=${keyInfo.hash} provider=${providerName} status=${classification.keyStatus} cooldown=${classification.cooldownMs ?? "none"}`,
        );

        lastError = safeError;

        if (!classification.retryable) {
          continue;
        }
      }
    }

    throw (
      lastError ||
      createAiError(
        AI_ERROR_CODES.AI_NO_VALID_API_KEY,
        `Nenhuma API key funcionou para o provedor ${providerName}.`,
        { provider: providerName, model },
      )
    );
  }

  getProviderStatus() {
    if (!this.config) {
      this.loadRuntimeData();
    }

    const providers = {};

    for (const providerName of Object.keys(this.config.providers || {})) {
      const providerConfig = this.getProviderConfig(providerName);
      const apiKeys = resolveApiKeys(providerConfig.apiKeys);
      const providerState = this.stateManager.getProviderState(providerName);

      providers[providerName] = {
        enabled: Boolean(providerConfig.enabled),
        kind: providerConfig.kind,
        defaultModel: providerConfig.defaultModel,
        configuredKeyCount: apiKeys.length,
        keyHashes: apiKeys.map(hashApiKey),
        state: providerState,
      };
    }

    providers.local = this.getLocalStatus();

    return {
      ok: true,
      aiEnabled: Boolean(this.config.ai.enabled),
      defaultProvider: this.config.ai.defaultProvider,
      activeProviders: this.getActiveProviders(),
      providers,
    };
  }

  getModelsRegistry() {
    if (!this.config) {
      this.loadRuntimeData();
    }

    return {
      ok: true,
      models: this.registry.map((model) => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        family: model.family,
        file: model.file,
        estimatedRamMin: model.estimatedRamMin,
        estimatedRamRecommended: model.estimatedRamRecommended,
        recommendedFor: model.recommendedFor,
        quality: model.quality,
        speed: model.speed,
        manualDownloadRequired: Boolean(model.manualDownloadRequired),
        hasDownloadUrl: Boolean(model.downloadUrl),
      })),
    };
  }

  getLocalStatus() {
    if (!this.config) {
      this.loadRuntimeData();
    }

    const local = this.config.local;
    const selectedModel = local?.selectedModel;
    const modelInfo = this.registry.find((item) => item.id === selectedModel);
    const modelPath = modelInfo
      ? `${this.paths.llamaModelsDir}/${modelInfo.family}/${modelInfo.file}`
      : null;

    return {
      enabled: Boolean(local?.enabled),
      provider: local?.provider || "llama.cpp",
      selectedModel,
      modelFoundInRegistry: Boolean(modelInfo),
      modelInstalled: Boolean(modelPath && fs.existsSync(modelPath)),
      modelPath,
      environment: detectLocalEnvironment(),
    };
  }

  async testProvider(providerName) {
    return this.request({
      provider: providerName,
      allowProviderFallback: false,
      messages: [
        {
          role: "user",
          content: "Responda apenas OK.",
        },
      ],
    });
  }

  async testAllProviders() {
    const results = {};

    for (const providerName of this.getActiveProviders()) {
      results[providerName] = await this.testProvider(providerName);
    }

    return {
      ok: true,
      results,
    };
  }

  async downloadLocalModel(modelId, options = {}) {
    if (!this.config) {
      this.loadRuntimeData();
    }

    const modelInfo = this.registry.find((item) => item.id === modelId);

    try {
      return await downloadLocalModel({
        paths: this.paths,
        modelInfo,
        force: options.force,
      });
    } catch (error) {
      return buildAiErrorObject(error);
    }
  }

  installLocalRuntime() {
    return {
      ok: true,
      environment: detectLocalEnvironment(),
      message:
        "Instalação automática destrutiva não é executada sem comando explícito. Use o installHint retornado para instalar o llama.cpp.",
    };
  }
}

export function createAiService(options = {}) {
  return new AiService(options);
}

export const aiService = new AiService();
