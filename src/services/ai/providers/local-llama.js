import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { AI_ERROR_CODES, createAiError } from "../errors.js";

const execFileAsync = promisify(execFile);

function messagesToPrompt(messages = []) {
  return messages
    .map((message) => {
      const role = message.role || "user";
      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content || "");

      return `${role.toUpperCase()}: ${content}`;
    })
    .join("\n\n");
}

function findModel(registry, modelId) {
  return registry.find((item) => item.id === modelId);
}

function buildModelPath(paths, modelInfo) {
  return path.join(paths.llamaModelsDir, modelInfo.family, modelInfo.file);
}

function resolveRuntimePath(providerConfig) {
  if (providerConfig.runtimePath && fs.existsSync(providerConfig.runtimePath)) {
    return providerConfig.runtimePath;
  }

  return "llama-cli";
}

export async function requestLocalLlama({
  providerConfig,
  model,
  messages,
  options = {},
  paths,
  registry,
}) {
  const selectedModel = model || providerConfig.selectedModel;
  const modelInfo = findModel(registry, selectedModel);

  if (!modelInfo) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      `Modelo local ${selectedModel} não encontrado no registro.`,
      { provider: "local", model: selectedModel },
    );
  }

  const modelPath = buildModelPath(paths, modelInfo);

  if (!fs.existsSync(modelPath)) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_INSTALLED,
      `Modelo local ${selectedModel} ainda não foi instalado em ${modelPath}.`,
      { provider: "local", model: selectedModel },
    );
  }

  const runtimePath = resolveRuntimePath(providerConfig);
  const prompt = options.prompt || messagesToPrompt(messages);
  const args = [
    "-m",
    modelPath,
    "-p",
    prompt,
    "-n",
    String(options.maxTokens ?? providerConfig.maxTokens ?? 512),
    "-c",
    String(options.contextSize ?? providerConfig.contextSize ?? 2048),
    "-t",
    String(options.threads ?? providerConfig.threads ?? 4),
    "--temp",
    String(options.temperature ?? providerConfig.temperature ?? 0.7),
    "--top-p",
    String(options.topP ?? providerConfig.topP ?? 0.9),
    "--repeat-penalty",
    String(options.repeatPenalty ?? providerConfig.repeatPenalty ?? 1.1),
  ];

  if (Number(providerConfig.gpuLayers) > 0) {
    args.push("-ngl", String(providerConfig.gpuLayers));
  }

  try {
    const { stdout } = await execFileAsync(runtimePath, args, {
      timeout: options.timeout || providerConfig.timeout || 120000,
      maxBuffer: 1024 * 1024 * 8,
    });

    return {
      text: stdout.trim(),
      data: {
        runtimePath,
        modelPath,
      },
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      throw createAiError(
        AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
        "Runtime llama.cpp não encontrado. Instale o llama.cpp ou configure local.runtimePath.",
        { provider: "local", model: selectedModel },
      );
    }

    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_LOAD_FAILED,
      error.message || "Falha ao executar modelo local.",
      { provider: "local", model: selectedModel },
    );
  }
}
