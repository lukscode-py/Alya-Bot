import fs from "node:fs";
import path from "node:path";
import { AI_CONFIG } from "../../config.js";

export function readJsonFile(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const rawContent = fs.readFileSync(filePath, "utf-8");

  if (!rawContent.trim()) {
    return fallback;
  }

  return JSON.parse(rawContent);
}

export function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(`${filePath}.tmp`, filePath);
}

function cloneConfig(value) {
  return structuredClone(value);
}

function normalizeAiConfig(config = {}) {
  return {
    ai: {
      enabled: false,
      defaultProvider: "gemini",
      fallbackProviders: [],
      activeProviders: [],
      ...(config.ai || {}),
    },
    providers: {
      ...(config.providers || {}),
    },
    local: {
      enabled: false,
      kind: "local",
      provider: "llama.cpp",
      selectedModel: "",
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
      ...(config.local || {}),
    },
  };
}

export function loadAiConfig(_paths, overrideConfig = null) {
  const source = overrideConfig || AI_CONFIG;
  return normalizeAiConfig(cloneConfig(source));
}

export function loadModelsRegistry(paths) {
  if (!fs.existsSync(paths.modelsRegistryPath)) {
    return [];
  }

  const parsed = readJsonFile(paths.modelsRegistryPath, []);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.models)) {
    return parsed.models;
  }

  return [];
}
