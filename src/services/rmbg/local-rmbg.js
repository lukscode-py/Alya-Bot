import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";
import axios from "axios";
import { RMBG_CONFIG, TEMP_DIR } from "../../config.js";

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

function installSystemPythonIfPossible() {
  if (!RMBG_CONFIG.runtime.autoInstallRuntime) {
    return;
  }

  if (isTermux()) {
    runShellSync(
      "pkg update -y && pkg install -y python clang libjpeg-turbo zlib freetype libpng openblas",
      { allowFail: true },
    );
    return;
  }

  if (process.platform === "win32") {
    if (commandExists("winget")) {
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
      runShellSync("apt-get update && apt-get install -y python3 python3-venv python3-pip", {
        allowFail: true,
      });
      return;
    }

    if (commandExists("sudo")) {
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

function installPythonPackages(python) {
  if (!RMBG_CONFIG.runtime.autoInstallRuntime) {
    return;
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

async function ensureRmbgModel() {
  const modelPath = RMBG_CONFIG.model.path;

  if (fs.existsSync(modelPath)) {
    return modelPath;
  }

  if (!RMBG_CONFIG.runtime.autoDownloadModel) {
    throw new Error(`Modelo RMBG não encontrado: ${modelPath}`);
  }

  await ensureDirectory(RMBG_CONFIG.model.directory);

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

export async function prepareLocalRmbg() {
  if (!RMBG_CONFIG.enabled) {
    throw new Error("RMBG local está desativado em RMBG_CONFIG.enabled.");
  }

  await ensureDirectory(TEMP_DIR);
  await ensureDirectory(RMBG_CONFIG.model.directory);

  if (!fs.existsSync(RMBG_CONFIG.runtime.scriptPath)) {
    throw new Error(`Script RMBG não encontrado: ${RMBG_CONFIG.runtime.scriptPath}`);
  }

  installSystemPythonIfPossible();

  const basePython = resolvePython();

  if (!basePython) {
    throw new Error(
      "Python não encontrado. Instale Python ou configure ALYA_RMBG_PYTHON_PATH.",
    );
  }

  const python = createVenvIfPossible(basePython);

  if (!checkPythonRuntime(python)) {
    installPythonPackages(python);
  }

  if (!checkPythonRuntime(python)) {
    throw new Error(
      "Não foi possível preparar TensorFlow Lite/LiteRT automaticamente. Verifique Python, pip, pillow, numpy e tflite-runtime.",
    );
  }

  const modelPath = await ensureRmbgModel();

  return {
    python,
    modelPath,
  };
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
