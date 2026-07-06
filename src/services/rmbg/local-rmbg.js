import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import axios from "axios";
import { RMBG_CONFIG, TEMP_DIR } from "../../config.js";
import { askYesNo } from "../ai/local-runtime.js";
import { infoLog, warningLog } from "../../utils/logger.js";

function isTermux() {
  return (
    process.env.TERMUX_VERSION ||
    String(process.env.PREFIX || "").includes("/com.termux/")
  );
}

function commandExists(command) {
  const checkCommand = process.platform === "win32" ? "where" : "command";
  const checkArgs = process.platform === "win32" ? [command] : ["-v", command];
  const result = spawnSync(checkCommand, checkArgs, {
    encoding: "utf8",
    stdio: "pipe",
    shell: process.platform !== "win32",
  });

  return result.status === 0;
}

function runSync(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    shell: false,
    ...options,
  });

  if (result.status !== 0 && !options.allowFail) {
    throw new Error(
      [
        `Falha ao executar: ${command} ${args.join(" ")}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return result;
}

function runShellSync(command, options = {}) {
  return runSync(process.platform === "win32" ? "cmd" : "sh", [
    process.platform === "win32" ? "/c" : "-lc",
    command,
  ], options);
}

function runPythonSync(python, args = [], options = {}) {
  return runSync(python.command, [...python.args, ...args], options);
}

function getVenvPythonPath(venvDir) {
  if (process.platform === "win32") {
    return path.join(venvDir, "Scripts", "python.exe");
  }

  return path.join(venvDir, "bin", "python");
}

function getPythonCandidates() {
  const configuredPython = RMBG_CONFIG.runtime.pythonPath;
  const candidates = [];

  if (configuredPython) {
    candidates.push({ command: configuredPython, args: [] });
  }

  const venvPython = getVenvPythonPath(RMBG_CONFIG.runtime.venvDir);

  if (fs.existsSync(venvPython)) {
    candidates.push({ command: venvPython, args: [] });
  }

  candidates.push(
    { command: "python3", args: [] },
    { command: "python", args: [] },
    { command: "py", args: ["-3"] },
  );

  return candidates;
}

function resolvePython() {
  for (const candidate of getPythonCandidates()) {
    const result = runPythonSync(candidate, ["--version"], { allowFail: true });

    if (result.status === 0) {
      return candidate;
    }
  }

  return null;
}

function shouldPromptRmbgSetup() {
  return Boolean(
    process.stdin.isTTY &&
      process.stdout.isTTY &&
      !process.env.CI &&
      !process.env.NODE_TEST_CONTEXT &&
      !process.argv.some((arg) => /(^|\/)(test|node:test)|--test/.test(arg)),
  );
}

function disableRmbgForCurrentRun(reason, onWarning = warningLog) {
  RMBG_CONFIG.enabled = false;

  if (onWarning) {
    onWarning(
      `[RMBG LOCAL] ${reason} Removebg local desativado automaticamente nesta execução.`,
    );
  }
}

function installSystemPythonIfPossible({
  autoInstallRuntime = RMBG_CONFIG.runtime.autoInstallRuntime,
  onLog = null,
} = {}) {
  if (!autoInstallRuntime) {
    return;
  }

  if (isTermux()) {
    if (onLog) {
      onLog("[RMBG LOCAL] Preparando dependências no Termux com pkg.");
    }

    runShellSync(
      "pkg update -y && pkg install -y python clang libjpeg-turbo zlib freetype libpng openblas",
      { allowFail: true },
    );
    return;
  }

  if (process.platform === "win32") {
    if (commandExists("winget")) {
      if (onLog) {
        onLog("[RMBG LOCAL] Tentando instalar Python no Windows com winget.");
      }

      runSync(
        "winget",
        [
          "install",
          "-e",
          "--id",
          "Python.Python.3.12",
          "--silent",
          "--accept-package-agreements",
          "--accept-source-agreements",
        ],
        { allowFail: true },
      );
    }

    return;
  }

  if (process.platform === "linux" && commandExists("apt-get")) {
    if (typeof process.getuid === "function" && process.getuid() === 0) {
      if (onLog) {
        onLog("[RMBG LOCAL] Tentando instalar Python/pip no Linux com apt-get.");
      }

      runShellSync("apt-get update && apt-get install -y python3 python3-venv python3-pip", {
        allowFail: true,
      });
      return;
    }

    if (commandExists("sudo")) {
      if (onLog) {
        onLog("[RMBG LOCAL] Tentando instalar Python/pip no Linux com sudo apt-get.");
      }

      runShellSync(
        "sudo -n apt-get update && sudo -n apt-get install -y python3 python3-venv python3-pip",
        { allowFail: true },
      );
    }
  }
}

async function ensureDirectory(directory) {
  await fs.promises.mkdir(directory, { recursive: true });
}

function createVenvIfPossible(basePython) {
  const venvDir = RMBG_CONFIG.runtime.venvDir;
  const venvPython = getVenvPythonPath(venvDir);

  if (fs.existsSync(venvPython)) {
    return { command: venvPython, args: [] };
  }

  fs.mkdirSync(path.dirname(venvDir), { recursive: true });

  const result = runPythonSync(basePython, ["-m", "venv", venvDir], {
    allowFail: true,
  });

  if (result.status === 0 && fs.existsSync(venvPython)) {
    return { command: venvPython, args: [] };
  }

  return basePython;
}

function checkPythonRuntime(python) {
  const result = runPythonSync(
    python,
    [RMBG_CONFIG.runtime.scriptPath, "--check-runtime"],
    { allowFail: true },
  );

  return result.status === 0;
}

function installPythonPackages(
  python,
  {
    autoInstallRuntime = RMBG_CONFIG.runtime.autoInstallRuntime,
    onLog = null,
  } = {},
) {
  if (!autoInstallRuntime) {
    return;
  }

  if (onLog) {
    onLog("[RMBG LOCAL] Instalando dependências Python para TensorFlow Lite/LiteRT.");
  }

  runPythonSync(python, ["-m", "ensurepip", "--upgrade"], { allowFail: true });
  runPythonSync(python, ["-m", "pip", "install", "--upgrade", "pip", "setuptools", "wheel"], {
    allowFail: true,
  });

  for (const packageName of RMBG_CONFIG.runtime.pipPackages) {
    runPythonSync(python, ["-m", "pip", "install", "--upgrade", packageName], {
      allowFail: true,
    });
  }

  if (checkPythonRuntime(python)) {
    return;
  }

  for (const packageName of RMBG_CONFIG.runtime.interpreterPackages) {
    runPythonSync(python, ["-m", "pip", "install", "--upgrade", packageName], {
      allowFail: true,
    });

    if (checkPythonRuntime(python)) {
      return;
    }
  }
}

async function ensureRmbgModel({
  autoDownloadModel = RMBG_CONFIG.runtime.autoDownloadModel,
  onLog = null,
} = {}) {
  const modelPath = RMBG_CONFIG.model.path;

  if (fs.existsSync(modelPath)) {
    return modelPath;
  }

  if (!autoDownloadModel) {
    throw new Error(`Modelo RMBG não encontrado: ${modelPath}`);
  }

  await ensureDirectory(RMBG_CONFIG.model.directory);

  if (onLog) {
    onLog(`[RMBG LOCAL] Baixando modelo ${RMBG_CONFIG.model.id}...`);
    onLog(`[RMBG LOCAL] Fonte: ${RMBG_CONFIG.model.url}`);
  }

  const tempModelPath = `${modelPath}.download`;
  const response = await axios.get(RMBG_CONFIG.model.url, {
    responseType: "stream",
    timeout: RMBG_CONFIG.runtime.timeout,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Falha ao baixar modelo RMBG. HTTP ${response.status}`);
  }

  await pipeline(response.data, fs.createWriteStream(tempModelPath));
  await fs.promises.rename(tempModelPath, modelPath);

  if (onLog) {
    onLog(`[RMBG LOCAL] Modelo salvo em: ${modelPath}`);
  }

  return modelPath;
}

async function runRmbgPython({ python, modelPath, inputPath, outputPath }) {
  const args = [
    ...python.args,
    RMBG_CONFIG.runtime.scriptPath,
    "--model",
    modelPath,
    "--input",
    inputPath,
    "--output",
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(python.command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, RMBG_CONFIG.runtime.timeout);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          [
            "Falha ao executar RMBG local.",
            stderr.trim(),
            stdout.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });
}

export async function getLocalRmbgStatus({ checkRuntime = true } = {}) {
  if (!RMBG_CONFIG.enabled) {
    return {
      enabled: false,
      ready: false,
      runtimeReady: false,
      modelInstalled: false,
      python: null,
      modelPath: RMBG_CONFIG.model.path,
    };
  }

  const python = resolvePython();
  const runtimeReady = Boolean(
    python && (!checkRuntime || checkPythonRuntime(python)),
  );
  const modelInstalled = fs.existsSync(RMBG_CONFIG.model.path);

  return {
    enabled: true,
    ready: runtimeReady && modelInstalled,
    runtimeReady,
    modelInstalled,
    python,
    modelPath: RMBG_CONFIG.model.path,
  };
}

export async function prepareLocalRmbg({
  autoInstallRuntime = RMBG_CONFIG.runtime.autoInstallRuntime,
  autoDownloadModel = RMBG_CONFIG.runtime.autoDownloadModel,
  onLog = null,
} = {}) {
  if (!RMBG_CONFIG.enabled) {
    throw new Error("RMBG local está desativado em RMBG_CONFIG.enabled.");
  }

  await ensureDirectory(TEMP_DIR);
  await ensureDirectory(RMBG_CONFIG.model.directory);

  if (!fs.existsSync(RMBG_CONFIG.runtime.scriptPath)) {
    throw new Error(`Script RMBG não encontrado: ${RMBG_CONFIG.runtime.scriptPath}`);
  }

  installSystemPythonIfPossible({ autoInstallRuntime, onLog });

  const basePython = resolvePython();

  if (!basePython) {
    throw new Error(
      "Python não encontrado. Instale Python ou configure ALYA_RMBG_PYTHON_PATH.",
    );
  }

  const python = createVenvIfPossible(basePython);

  if (!checkPythonRuntime(python)) {
    installPythonPackages(python, { autoInstallRuntime, onLog });
  }

  if (!checkPythonRuntime(python)) {
    throw new Error(
      "Não foi possível preparar TensorFlow Lite/LiteRT automaticamente. Verifique Python, pip, pillow, numpy e tflite-runtime.",
    );
  }

  const modelPath = await ensureRmbgModel({ autoDownloadModel, onLog });

  return {
    python,
    modelPath,
  };
}

export async function prepareLocalRmbgStartup({
  interactive = shouldPromptRmbgSetup(),
  onLog = infoLog,
  onWarning = warningLog,
} = {}) {
  if (!RMBG_CONFIG.enabled) {
    return {
      ok: true,
      skipped: true,
      enabled: false,
    };
  }

  onLog("[RMBG LOCAL] Preparação do removebg local iniciada antes da conexão do bot.");

  const status = await getLocalRmbgStatus();

  if (status.ready) {
    onLog("[RMBG LOCAL] TensorFlow Lite/LiteRT validado e modelo RMBG já instalado.");
    return {
      ok: true,
      runtimeReady: true,
      modelInstalled: true,
    };
  }

  let shouldPrepareRuntime = true;

  if (!status.runtimeReady) {
    onWarning("[RMBG LOCAL] Ambiente TensorFlow Lite/LiteRT não está preparado.");

    shouldPrepareRuntime =
      Boolean(RMBG_CONFIG.runtime.autoInstallRuntime) ||
      (Boolean(RMBG_CONFIG.runtime.askBeforePrepare) &&
        (await askYesNo(
          [
            "O removebg local está ativado, mas o ambiente TensorFlow Lite/LiteRT não está preparado.",
            "Deseja preparar o ambiente agora? Se cancelar, o removebg local será desativado automaticamente. (s/n) >",
          ].join("\n"),
          { enabled: interactive, defaultValue: false, onLog: onWarning },
        )));

    if (!shouldPrepareRuntime) {
      disableRmbgForCurrentRun("Preparo do ambiente recusado.", onWarning);
      return {
        ok: false,
        disabled: true,
        reason: "runtime-prepare-refused",
      };
    }
  }

  let shouldDownloadModel = true;

  if (!status.modelInstalled) {
    onWarning(`[RMBG LOCAL] Modelo ${RMBG_CONFIG.model.id} não instalado.`);

    shouldDownloadModel =
      Boolean(RMBG_CONFIG.runtime.autoDownloadModel) ||
      (Boolean(RMBG_CONFIG.runtime.askBeforeDownload) &&
        (await askYesNo(
          [
            `O removebg local está ativado, mas o modelo ${RMBG_CONFIG.model.id} não está instalado.`,
            `Arquivo: ${RMBG_CONFIG.model.fileName}`,
            `Fonte: ${RMBG_CONFIG.model.url}`,
            "Deseja baixar o modelo agora? Se cancelar, o removebg local será desativado automaticamente. (s/n) >",
          ].join("\n"),
          { enabled: interactive, defaultValue: false, onLog: onWarning },
        )));

    if (!shouldDownloadModel) {
      disableRmbgForCurrentRun("Download do modelo recusado.", onWarning);
      return {
        ok: false,
        disabled: true,
        reason: "model-download-refused",
      };
    }
  }

  try {
    onLog("[RMBG LOCAL] Preparação confirmada. A inicialização ficará pausada até terminar.");

    await prepareLocalRmbg({
      autoInstallRuntime: shouldPrepareRuntime,
      autoDownloadModel: shouldDownloadModel,
      onLog,
    });

    onLog("[RMBG LOCAL] Ambiente e modelo prontos. Continuando inicialização do bot.");

    return {
      ok: true,
      runtimeReady: true,
      modelInstalled: true,
    };
  } catch (error) {
    disableRmbgForCurrentRun(
      error.message || "Falha ao preparar removebg local.",
      onWarning,
    );

    return {
      ok: false,
      disabled: true,
      reason: "prepare-failed",
    };
  }
}

export async function removeBackgroundLocal(inputBuffer, options = {}) {
  if (!Buffer.isBuffer(inputBuffer)) {
    throw new Error("removeBackgroundLocal espera um Buffer de imagem.");
  }

  const prepared = RMBG_CONFIG.runtime.autoPrepare
    ? await prepareLocalRmbg()
    : {
        python: resolvePython(),
        modelPath: RMBG_CONFIG.model.path,
      };

  const id = crypto.randomBytes(8).toString("hex");
  const extension = path.extname(options.fileName || "") || ".png";
  const inputPath = path.join(TEMP_DIR, `rmbg-input-${id}${extension}`);
  const outputPath = path.join(TEMP_DIR, `rmbg-output-${id}.png`);

  try {
    await ensureDirectory(TEMP_DIR);
    await fs.promises.writeFile(inputPath, inputBuffer);

    await runRmbgPython({
      python: prepared.python,
      modelPath: prepared.modelPath,
      inputPath,
      outputPath,
    });

    return await fs.promises.readFile(outputPath);
  } finally {
    await fs.promises.rm(inputPath, { force: true });
    await fs.promises.rm(outputPath, { force: true });
  }
}
