import axios from "axios";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { AI_ERROR_CODES, createAiError } from "./errors.js";

export function detectLocalEnvironment() {
  const platform = process.platform;
  const isTermux = Boolean(process.env.PREFIX?.includes("com.termux"));

  if (isTermux) {
    return {
      type: "termux",
      packageManager: "pkg",
      installHint:
        "pkg install -y git cmake make clang && git clone https://github.com/ggerganov/llama.cpp",
    };
  }

  if (platform === "linux") {
    return {
      type: "linux",
      packageManager: fs.existsSync("/usr/bin/apt") ? "apt" : fs.existsSync("/usr/bin/pacman") ? "pacman" : "unknown",
      installHint:
        fs.existsSync("/usr/bin/apt")
          ? "sudo apt update && sudo apt install -y git cmake make g++"
          : "Instale git, cmake, make e compilador C++ para compilar llama.cpp.",
    };
  }

  if (platform === "win32") {
    return {
      type: "windows",
      packageManager: "manual",
      installHint:
        "Baixe um binário pré-compilado do llama.cpp ou compile manualmente e configure local.runtimePath.",
    };
  }

  return {
    type: "unknown",
    packageManager: "unknown",
    installHint: "Ambiente não reconhecido. Instale llama.cpp manualmente.",
  };
}

export function getLocalModelPath(paths, modelInfo) {
  return path.join(paths.llamaModelsDir, modelInfo.family, modelInfo.file);
}

export function hasEnoughDiskSpaceHint(modelInfo) {
  return {
    ok: true,
    message:
      "Verificação real de espaço em disco ainda não foi aplicada. Confira espaço disponível antes de baixar modelos grandes.",
    model: modelInfo?.id,
    freeMemoryHint: os.freemem(),
  };
}

export async function downloadLocalModel({ paths, modelInfo, force = false }) {
  if (!modelInfo) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      "Modelo não encontrado no registro local.",
    );
  }

  if (!modelInfo.downloadUrl) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_DOWNLOAD_FAILED,
      `O modelo ${modelInfo.id} não possui downloadUrl verificado. Baixe manualmente e coloque em assets/ai/models/llama.cpp/${modelInfo.family}/${modelInfo.file}.`,
      { provider: "local", model: modelInfo.id },
    );
  }

  const outputPath = getLocalModelPath(paths, modelInfo);

  if (fs.existsSync(outputPath) && !force) {
    return {
      ok: true,
      skipped: true,
      model: modelInfo.id,
      path: outputPath,
      message: "Modelo já existe no disco.",
    };
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const response = await axios.get(modelInfo.downloadUrl, {
    responseType: "stream",
    timeout: 120000,
  });

  const contentType = response.headers?.["content-type"] || "";

  if (/text\/html/i.test(contentType)) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_DOWNLOAD_FAILED,
      "O link retornou HTML em vez de arquivo de modelo. Use um link direto real.",
      { provider: "local", model: modelInfo.id },
    );
  }

  await pipeline(response.data, fs.createWriteStream(outputPath));

  return {
    ok: true,
    skipped: false,
    model: modelInfo.id,
    path: outputPath,
  };
}
