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

const RUNTIME_CANDIDATES = [
  "llama-cli",
  "llama-cli.exe",
  "llama",
  "llama.exe",
  "main",
  "main.exe",
];

function isTermux() {
  return Boolean(process.env.PREFIX?.includes("com.termux"));
}

function splitPathEnv() {
  return String(process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);
}

function findExecutable(command) {
  if (!command) {
    return "";
  }

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

async function canExecuteRuntime(runtimePath) {
  if (!runtimePath) {
    return false;
  }

  try {
    await execFileAsync(runtimePath, ["--help"], {
      timeout: 15000,
      maxBuffer: 1024 * 1024 * 2,
    });

    return true;
  } catch (error) {
    // Alguns builds imprimem help em stderr e retornam 0/1 dependendo da versão.
    const outputText = `${error.stdout || ""}\n${error.stderr || ""}\n${error.message || ""}`;

    return /llama|usage|model|prompt|gguf/i.test(outputText);
  }
}

function getInstallCommands(environment) {
  if (environment.type === "termux") {
    return [
      {
        title: "Instalar llama.cpp pelo pacote pré-compilado do Termux",
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
        "Use pacote pré-compilado: brew install llama.cpp, nix profile install nixpkgs#llama-cpp ou conda install -y -c conda-forge llama-cpp.",
    };
  }

  return {
    type: "unknown",
    packageManager: "unknown",
    installHint:
      "Ambiente não reconhecido. Instale um binário pré-compilado do llama.cpp e configure local.runtimePath em src/config.js.",
  };
}

export async function getLocalRuntimeStatus(providerConfig = {}) {
  const configuredRuntime = String(providerConfig.runtimePath || "").trim();
  const candidates = configuredRuntime
    ? [configuredRuntime, ...RUNTIME_CANDIDATES]
    : RUNTIME_CANDIDATES;

  for (const candidate of candidates) {
    const runtimePath = findExecutable(candidate);

    if (!runtimePath) {
      continue;
    }

    const executable = await canExecuteRuntime(runtimePath);

    if (executable) {
      return {
        ready: true,
        runtimePath,
        source: configuredRuntime && runtimePath === configuredRuntime ? "config" : "path",
        candidates,
      };
    }
  }

  return {
    ready: false,
    runtimePath: "",
    source: "",
    candidates,
  };
}

export async function askYesNo(
  question,
  { defaultValue = false, enabled = true, onLog = null } = {},
) {
  if (!enabled) {
    if (onLog) {
      onLog("[AI LOCAL] Pergunta interativa desativada. Usando resposta padrão: não.");
    }

    return defaultValue;
  }

  if (!input.isTTY || !output.isTTY) {
    if (onLog) {
      onLog(
        "[AI LOCAL] Terminal não interativo detectado. Não é possível responder s/n aqui. Usando resposta padrão: não.",
      );
    }

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

export async function installLocalRuntime({ providerConfig = {}, onLog = null } = {}) {
  const currentStatus = await getLocalRuntimeStatus(providerConfig);

  if (currentStatus.ready) {
    return {
      ok: true,
      skipped: true,
      runtimePath: currentStatus.runtimePath,
      message: "Runtime local já estava instalado e validado.",
    };
  }

  const environment = detectLocalEnvironment();
  const installCommands = getInstallCommands(environment).filter((item) =>
    commandExists(item.command),
  );

  if (!installCommands.length) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
      `Não encontrei instalador automático disponível. Use as instruções do prepare-ai-ambiente.sh para baixar um binário compilado do llama.cpp Releases ou configure local.runtimePath em src/config.js. ${environment.installHint}`,
      { provider: "local" },
    );
  }

  const errors = [];

  for (const installCommand of installCommands) {
    const commandText = `${installCommand.command} ${installCommand.args.join(" ")}`;

    if (onLog) {
      onLog(`[AI LOCAL] Executando: ${commandText}`);
    }

    try {
      await execFileAsync(installCommand.command, installCommand.args, {
        timeout: 1000 * 60 * 20,
        maxBuffer: 1024 * 1024 * 16,
      });

      const nextStatus = await getLocalRuntimeStatus(providerConfig);

      if (nextStatus.ready) {
        return {
          ok: true,
          skipped: false,
          runtimePath: nextStatus.runtimePath,
          command: commandText,
          message: installCommand.title,
        };
      }

      errors.push(`${commandText}: terminou, mas llama-cli não ficou executável`);
    } catch (error) {
      errors.push(`${commandText}: ${error.message}`);
    }
  }

  throw createAiError(
    AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
    `Não consegui instalar/validar runtime local automaticamente. Use as instruções do prepare-ai-ambiente.sh para baixar o binário compilado do llama.cpp Releases ou configure local.runtimePath em src/config.js. ${environment.installHint}\n${errors.join("\n")}`,
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

export async function downloadLocalModel({ paths, modelInfo, force = false, onLog = null }) {
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

  if (onLog) {
    onLog(`[AI LOCAL] Baixando modelo ${modelInfo.id}...`);
    onLog(`[AI LOCAL] URL: ${modelInfo.downloadUrl}`);
    onLog(`[AI LOCAL] Destino: ${outputPath}`);
  }

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

  const stat = fs.statSync(outputPath);

  if (stat.size < 1024 * 1024) {
    fs.rmSync(outputPath, { force: true });

    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_DOWNLOAD_FAILED,
      "Arquivo baixado é pequeno demais para ser um modelo GGUF válido.",
      { provider: "local", model: modelInfo.id },
    );
  }

  return {
    ok: true,
    skipped: false,
    model: modelInfo.id,
    path: outputPath,
    sizeBytes: stat.size,
  };
}
