import axios from "axios";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { promisify } from "node:util";
import { AI_ERROR_CODES, createAiError } from "./errors.js";

const execFileAsync = promisify(execFile);

const OLLAMA_CANDIDATES = [
  "ollama",
  "ollama.exe",
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

function normalizeBaseUrl(baseUrl = "") {
  return String(baseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function detectLocalEnvironment() {
  const platform = process.platform;

  if (isTermux()) {
    return {
      type: "termux",
      packageManager: "pkg",
      installHint: "pkg update -y && pkg upgrade -y && pkg install tur-repo -y && pkg install ollama -y",
    };
  }

  if (platform === "win32") {
    return {
      type: "windows",
      packageManager: "powershell",
      installHint: "irm https://ollama.com/install.ps1 | iex",
    };
  }

  if (platform === "darwin") {
    return {
      type: "macos",
      packageManager: "manual",
      installHint: "Instale pelo site oficial do Ollama ou use o gerenciador de pacotes disponível no sistema.",
    };
  }

  if (platform === "linux") {
    return {
      type: "linux",
      packageManager: "shell",
      installHint: "curl -fsSL https://ollama.com/install.sh | sh",
    };
  }

  return {
    type: "unknown",
    packageManager: "manual",
    installHint: "Instale o Ollama manualmente e confirme que o comando ollama está no PATH.",
  };
}

export async function getLocalRuntimeStatus(providerConfig = {}) {
  const configuredRuntime = String(providerConfig.runtimePath || "").trim();
  const candidates = configuredRuntime
    ? [configuredRuntime, ...OLLAMA_CANDIDATES]
    : OLLAMA_CANDIDATES;

  for (const candidate of candidates) {
    const runtimePath = findExecutable(candidate);

    if (!runtimePath) {
      continue;
    }

    try {
      const { stdout, stderr } = await execFileAsync(runtimePath, ["--version"], {
        timeout: 15000,
        maxBuffer: 1024 * 1024 * 2,
      });

      return {
        ready: true,
        runtimePath,
        source: configuredRuntime && runtimePath === configuredRuntime ? "config" : "path",
        version: `${stdout || stderr}`.trim(),
        candidates,
      };
    } catch (error) {
      const outputText = `${error.stdout || ""}\n${error.stderr || ""}\n${error.message || ""}`;

      if (/ollama/i.test(outputText)) {
        return {
          ready: true,
          runtimePath,
          source: configuredRuntime && runtimePath === configuredRuntime ? "config" : "path",
          version: outputText.trim(),
          candidates,
        };
      }
    }
  }

  return {
    ready: false,
    runtimePath: "",
    source: "",
    version: "",
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
      message: "Ollama já estava instalado e validado.",
    };
  }

  const environment = detectLocalEnvironment();

  if (environment.type === "termux") {
    const commands = [
      ["pkg", ["update", "-y"]],
      ["pkg", ["upgrade", "-y"]],
      ["pkg", ["install", "tur-repo", "-y"]],
      ["pkg", ["install", "ollama", "-y"]],
    ];

    for (const [command, args] of commands) {
      if (onLog) {
        onLog(`[AI LOCAL] Executando: ${command} ${args.join(" ")}`);
      }

      await execFileAsync(command, args, {
        timeout: 1000 * 60 * 20,
        maxBuffer: 1024 * 1024 * 16,
      });
    }
  } else if (environment.type === "linux") {
    if (onLog) {
      onLog("[AI LOCAL] Executando instalador oficial do Ollama para Linux.");
    }

    await execFileAsync("sh", ["-c", "curl -fsSL https://ollama.com/install.sh | sh"], {
      timeout: 1000 * 60 * 20,
      maxBuffer: 1024 * 1024 * 16,
    });
  } else if (environment.type === "windows") {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
      "No Windows, instale o Ollama pelo PowerShell como Administrador: irm https://ollama.com/install.ps1 | iex",
      { provider: "local" },
    );
  } else {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
      `Instalação automática do Ollama não suportada neste ambiente. ${environment.installHint}`,
      { provider: "local" },
    );
  }

  const nextStatus = await getLocalRuntimeStatus(providerConfig);

  if (nextStatus.ready) {
    return {
      ok: true,
      skipped: false,
      runtimePath: nextStatus.runtimePath,
      message: "Ollama instalado e validado.",
    };
  }

  throw createAiError(
    AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
    `O Ollama foi instalado, mas o comando não ficou executável. ${environment.installHint}`,
    { provider: "local" },
  );
}

async function requestOllama(pathname, providerConfig = {}, options = {}) {
  const baseUrl = normalizeBaseUrl(providerConfig.baseUrl);
  return axios({
    url: `${baseUrl}${pathname}`,
    method: options.method || "GET",
    data: options.data,
    timeout: options.timeout || providerConfig.healthTimeout || 15000,
    validateStatus: () => true,
  });
}

export async function getOllamaServerStatus(providerConfig = {}) {
  try {
    const response = await requestOllama("/api/tags", providerConfig);

    return {
      ready: response.status >= 200 && response.status < 300,
      status: response.status,
      baseUrl: normalizeBaseUrl(providerConfig.baseUrl),
      models: Array.isArray(response.data?.models) ? response.data.models : [],
    };
  } catch (error) {
    return {
      ready: false,
      status: 0,
      baseUrl: normalizeBaseUrl(providerConfig.baseUrl),
      models: [],
      error: error.message,
    };
  }
}

export async function startOllamaServer({ providerConfig = {}, onLog = null } = {}) {
  const runtimeStatus = await getLocalRuntimeStatus(providerConfig);

  if (!runtimeStatus.ready) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
      "Ollama não encontrado. Instale o Ollama antes de iniciar o servidor local.",
      { provider: "local" },
    );
  }

  const currentServer = await getOllamaServerStatus(providerConfig);

  if (currentServer.ready) {
    return {
      ok: true,
      skipped: true,
      runtimePath: runtimeStatus.runtimePath,
      baseUrl: currentServer.baseUrl,
      message: "Servidor Ollama já estava rodando.",
    };
  }

  const logFile = providerConfig.logFile || path.join(os.tmpdir(), "alya-ollama.log");
  const out = fs.openSync(logFile, "a");
  const child = spawn(runtimeStatus.runtimePath, ["serve"], {
    detached: true,
    stdio: ["ignore", out, out],
    env: {
      ...process.env,
      OLLAMA_HOST: providerConfig.host || "127.0.0.1:11434",
    },
  });

  child.unref();

  if (onLog) {
    onLog(`[AI LOCAL] Ollama iniciado pelo bot com ollama serve. pid=${child.pid} log=${logFile}`);
  }

  const attempts = Number(providerConfig.serverStartAttempts || 20);
  const delayMs = Number(providerConfig.serverStartDelayMs || 1000);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await sleep(delayMs);

    const serverStatus = await getOllamaServerStatus(providerConfig);

    if (serverStatus.ready) {
      return {
        ok: true,
        skipped: false,
        runtimePath: runtimeStatus.runtimePath,
        baseUrl: serverStatus.baseUrl,
        pid: child.pid,
        logFile,
        message: "Servidor Ollama iniciado.",
      };
    }
  }

  throw createAiError(
    AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
    `Ollama foi iniciado, mas a API local não respondeu em ${normalizeBaseUrl(providerConfig.baseUrl)}.`,
    { provider: "local" },
  );
}

export async function ensureOllamaServer({ providerConfig = {}, onLog = null } = {}) {
  const serverStatus = await getOllamaServerStatus(providerConfig);

  if (serverStatus.ready) {
    return {
      ok: true,
      skipped: true,
      baseUrl: serverStatus.baseUrl,
      models: serverStatus.models,
    };
  }

  if (providerConfig.autoStartServer === false) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_RUNTIME_NOT_FOUND,
      `Servidor Ollama não está rodando em ${serverStatus.baseUrl}.`,
      { provider: "local" },
    );
  }

  return startOllamaServer({
    providerConfig,
    onLog,
  });
}

function normalizeModelName(modelInfoOrId) {
  if (typeof modelInfoOrId === "string") {
    return modelInfoOrId;
  }

  return modelInfoOrId?.ollamaModel || modelInfoOrId?.id || "";
}

function parseOllamaPullLine(line) {
  const trimmedLine = String(line || "").trim();

  if (!trimmedLine) {
    return null;
  }

  try {
    return JSON.parse(trimmedLine);
  } catch {
    return {
      status: trimmedLine,
    };
  }
}

function formatPullProgress(event) {
  if (!event) {
    return "";
  }

  if (event.error) {
    return `erro: ${event.error}`;
  }

  if (event.completed && event.total) {
    const percent = Math.min(100, Math.round((event.completed / event.total) * 100));
    const completedMb = Math.round(event.completed / 1024 / 1024);
    const totalMb = Math.round(event.total / 1024 / 1024);

    return `${event.status || "baixando"} ${percent}% (${completedMb}/${totalMb} MB)`;
  }

  return event.status || "";
}

async function consumeOllamaPullStream(stream, onLog = null) {
  let buffer = "";
  let lastMessage = "";

  for await (const chunk of stream) {
    buffer += chunk.toString("utf8");

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      const event = parseOllamaPullLine(line);

      if (!event) {
        continue;
      }

      if (event.error) {
        throw new Error(event.error);
      }

      const message = formatPullProgress(event);

      if (message && message !== lastMessage) {
        lastMessage = message;

        if (onLog) {
          onLog(`[AI LOCAL] Ollama pull: ${message}`);
        }
      }
    }
  }

  const finalEvent = parseOllamaPullLine(buffer);

  if (finalEvent?.error) {
    throw new Error(finalEvent.error);
  }

  const finalMessage = formatPullProgress(finalEvent);

  if (finalMessage && finalMessage !== lastMessage && onLog) {
    onLog(`[AI LOCAL] Ollama pull: ${finalMessage}`);
  }
}

export function isOllamaModelInstalled(models = [], modelName = "") {
  return models.some((model) => {
    const name = model?.name || model?.model || "";
    return name === modelName || name === `${modelName}:latest`;
  });
}

export async function ensureOllamaModel({ providerConfig = {}, model, onLog = null } = {}) {
  const modelName = normalizeModelName(model);

  if (!modelName) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      "Modelo Ollama não informado.",
      { provider: "local" },
    );
  }

  await ensureOllamaServer({
    providerConfig,
    onLog,
  });

  const tags = await getOllamaServerStatus(providerConfig);

  if (isOllamaModelInstalled(tags.models, modelName)) {
    return {
      ok: true,
      skipped: true,
      model: modelName,
      message: "Modelo Ollama já instalado.",
    };
  }

  if (providerConfig.autoDownloadModel === false) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_INSTALLED,
      `Modelo Ollama ${modelName} não instalado. Use o CLI ou ative autoDownloadModel.`,
      { provider: "local", model: modelName },
    );
  }

  if (onLog) {
    onLog(`[AI LOCAL] Baixando modelo Ollama: ${modelName}`);
    onLog("[AI LOCAL] Aguarde. O bot só continuará depois que o download terminar.");
  }

  const response = await axios.post(
    `${normalizeBaseUrl(providerConfig.baseUrl)}/api/pull`,
    {
      name: modelName,
      stream: true,
    },
    {
      timeout: providerConfig.pullTimeout || 1000 * 60 * 30,
      responseType: "stream",
      validateStatus: () => true,
    },
  );

  if (response.status < 200 || response.status >= 300) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_DOWNLOAD_FAILED,
      response.data?.error || `Falha ao baixar modelo Ollama ${modelName}.`,
      { provider: "local", model: modelName },
    );
  }

  try {
    await consumeOllamaPullStream(response.data, onLog);
  } catch (error) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_DOWNLOAD_FAILED,
      error.message || `Falha ao baixar modelo Ollama ${modelName}.`,
      { provider: "local", model: modelName },
    );
  }

  return {
    ok: true,
    skipped: false,
    model: modelName,
    message: "Modelo Ollama baixado.",
  };
}

export async function deleteOllamaModel({ providerConfig = {}, model } = {}) {
  const modelName = normalizeModelName(model);

  if (!modelName) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      "Modelo Ollama não informado para remoção.",
      { provider: "local" },
    );
  }

  await ensureOllamaServer({
    providerConfig,
  });

  const response = await requestOllama("/api/delete", providerConfig, {
    method: "DELETE",
    data: {
      name: modelName,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_DOWNLOAD_FAILED,
      response.data?.error || `Falha ao apagar modelo Ollama ${modelName}.`,
      { provider: "local", model: modelName },
    );
  }

  return {
    ok: true,
    model: modelName,
    message: "Modelo Ollama removido.",
  };
}

export async function listOllamaModels({ providerConfig = {} } = {}) {
  await ensureOllamaServer({
    providerConfig,
  });

  const status = await getOllamaServerStatus(providerConfig);

  return {
    ok: true,
    baseUrl: status.baseUrl,
    models: status.models,
  };
}

export function getLocalModelPath(_paths, modelInfo) {
  return normalizeModelName(modelInfo);
}

export function hasEnoughDiskSpaceHint(modelInfo) {
  return {
    ok: true,
    message:
      "Com Ollama, o download e armazenamento do modelo são gerenciados pelo próprio Ollama.",
    model: normalizeModelName(modelInfo),
    freeMemoryHint: os.freemem(),
  };
}

export async function downloadLocalModel({ modelInfo, onLog = null }) {
  if (!modelInfo) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      "Modelo não encontrado no registro local.",
    );
  }

  return ensureOllamaModel({
    providerConfig: {
      baseUrl: "http://127.0.0.1:11434",
      autoStartServer: true,
      autoDownloadModel: true,
    },
    model: modelInfo.ollamaModel || modelInfo.id,
    onLog,
  });
}
