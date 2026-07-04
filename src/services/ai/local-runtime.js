import axios from "axios";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { AI_ERROR_CODES, createAiError } from "./errors.js";

const execFileAsync = promisify(execFile);
const RUNTIME_CANDIDATES = ["llama-cli", "llama-cli.exe", "llama", "llama.exe", "main", "main.exe"];

function isTermux() {
  return Boolean(process.env.PREFIX?.includes("com.termux"));
}

function splitPathEnv() {
  return String(process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
}

function findExecutable(command) {
  if (path.isAbsolute(command) && fs.existsSync(command)) {
    return command;
  }

  for (const dir of splitPathEnv()) {
    const fullPath = path.join(dir, command);

    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return "";
}

function commandExists(command) {
  return Boolean(findExecutable(command));
}

function getInstallCommands(environment) {
  if (environment.type === "termux") {
    return [
      {
        title: "Instalar llama.cpp pelo pacote do Termux",
        command: "pkg",
        args: ["install", "-y", "llama-cpp"],
      },
    ];
  }

  if (process.platform === "win32") {
    return [
      {
        title: "Instalar llama.cpp pelo winget",
        command: "winget",
        args: ["install", "llama.cpp"],
      },
      {
        title: "Instalar llama.cpp pelo conda-forge",
        command: "conda",
        args: ["install", "-y", "-c", "conda-forge", "llama-cpp"],
      },
      {
        title: "Instalar llama.cpp pelo mamba/conda-forge",
        command: "mamba",
        args: ["install", "-y", "-c", "conda-forge", "llama-cpp"],
      },
    ];
  }

  return [
    {
      title: "Instalar llama.cpp pelo Homebrew",
      command: "brew",
      args: ["install", "llama.cpp"],
    },
    {
      title: "Instalar llama.cpp pelo Nix profile",
      command: "nix",
      args: ["profile", "install", "nixpkgs#llama-cpp"],
    },
    {
      title: "Instalar llama.cpp pelo nix-env",
      command: "nix-env",
      args: ["--file", "<nixpkgs>", "--install", "--attr", "llama-cpp"],
    },
    {
      title: "Instalar llama.cpp pelo conda-forge",
      command: "conda",
      args: ["install", "-y", "-c", "conda-forge", "llama-cpp"],
    },
    {
      title: "Instalar llama.cpp pelo mamba/conda-forge",
      command: "mamba",
      args: ["install", "-y", "-c", "conda-forge", "llama-cpp"],
    },
    {
      title: "Instalar llama.cpp pelo pixi global",
      command: "pixi",
      args: ["global", "install", "llama-cpp"],
    },
  ];
}

export function detectLocalEnvironment() {
  const platform = process.platform;

  if (isTermux()) {
    return {
      type: "termux",
      packageManager: "pkg",
      installHint: "pkg update && pkg install -y llama-cpp",
    };
  }

  if (platform === "win32") {
    return {
      type: "windows",
      packageManager: commandExists("winget") ? "winget" : "manual",
      installHint: "winget install llama.cpp ou conda install -y -c conda-forge llama-cpp",
    };
  }

  if (platform === "darwin") {
    return {
      type: "macos",
      packageManager: commandExists("brew") ? "brew" : commandExists("nix") ? "nix" : "manual",
      installHint: "brew install llama.cpp ou nix profile install nixpkgs#llama-cpp",
    };
  }

  if (platform === "linux") {
    return {
      type: "linux",
      packageManager: commandExists("brew")
        ? "brew"
        : commandExists("nix")
          ? "nix"
          : commandExists("conda")
            ? "conda"
            : "manual",
      installHint:
        "Use um binário pré-compilado: brew install llama.cpp, nix profile install nixpkgs#llama-cpp ou conda install -y -c conda-forge llama-cpp.",
    };
  }

  return {
    type: "unknown",
    packageManager: "unknown",
    installHint:
      "Ambiente não reconhecido. Instale um binário pré-compilado do llama.cpp e configure local.runtimePath em src/config.js.",
  };
}

export function getLocalRuntimeStatus(providerConfig = {}) {
  const configuredRuntime = String(providerConfig.runtimePath || "").trim();

  if (configuredRuntime && fs.existsSync(configuredRuntime)) {
    return {
      ready: true,
      runtimePath: configuredRuntime,
      source: "config",
      candidates: RUNTIME_CANDIDATES,
    };
  }

  for (const candidate of RUNTIME_CANDIDATES) {
    const runtimePath = findExecutable(candidate);

    if (runtimePath) {
      return {
        ready: true,
        runtimePath,
        source: "path",
        candidates: RUNTIME_CANDIDATES,
      };
    }
  }

  return {
    ready: false,
    runtimePath: "",
    source: "",
    candidates: RUNTIME_CANDIDATES,
  };
}

export async function askYesNo(question, { defaultValue = false, enabled = true } = {}) {
  if (!enabled || !input.isTTY || !output.isTTY) {
    return defaultValue;
  }

  const rl = createInterface({ input, output });

  try {
    const answer = String(await rl.question(`${question} `)).trim().toLowerCase();
    return ["s", "sim", "y", "yes"].includes(answer);
  } finally {
    rl.close();
  }
}

export async function installLocalRuntime({ providerConfig = {} } = {}) {
  const currentStatus = getLocalRuntimeStatus(providerConfig);

  if (currentStatus.ready) {
    return {
      ok: true,
      skipped: true,
      runtimePath: currentStatus.runtimePath,
      message: "Runtime local já está instalado.",
    };
  }

  const environment = detectLocalEnvironment();
  const installCommands = getInstallCommands(environment).filter((item) =>
    commandExists(item.command),
  );

  if (!installCommands.length) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
      `Não encontrei instalador pré-compilado disponível. ${environment.installHint}`,
      { provider: "local" },
    );
  }

  const errors = [];

  for (const installCommand of installCommands) {
    try {
      await execFileAsync(installCommand.command, installCommand.args, {
        timeout: 1000 * 60 * 15,
        maxBuffer: 1024 * 1024 * 16,
      });

      const nextStatus = getLocalRuntimeStatus(providerConfig);

      if (nextStatus.ready) {
        return {
          ok: true,
          skipped: false,
          runtimePath: nextStatus.runtimePath,
          command: `${installCommand.command} ${installCommand.args.join(" ")}`,
          message: installCommand.title,
        };
      }
    } catch (error) {
      errors.push(`${installCommand.command}: ${error.message}`);
    }
  }

  throw createAiError(
    AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
    `Não consegui instalar runtime local sem compilação. ${environment.installHint}\n${errors.join("\n")}`,
    { provider: "local" },
  );
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
