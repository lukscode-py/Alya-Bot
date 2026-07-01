import pkg from "../../package.json" with { type: "json" };

const RESET = "\x1b[0m";
const COLORS = {
  talk: "\x1b[36m",
  input: "\x1b[30m",
  info: "\x1b[34m",
  success: "\x1b[32m",
  error: "\x1b[31m",
  warning: "\x1b[33m",
};

let consoleNoiseFilterInstalled = false;

function buildPrefix(type, color) {
  return `${color}[ALYA BOT | ${type}]${RESET}`;
}

function writeLog(type, color, message, ...extra) {
  console.log(buildPrefix(type, color), message, ...extra);
}

export function installConsoleNoiseFilter() {
  if (consoleNoiseFilterInstalled) {
    return;
  }

  const originalConsoleInfo = console.info.bind(console);

  console.info = (...args) => {
    if (args[0] === "Closing session:") {
      warningLog(
        "O WhatsApp fechou uma sessão criptografada antiga para renovar as chaves. Isso é um aviso normal da conexão e não indica erro no bot.",
      );
      return;
    }

    originalConsoleInfo(...args);
  };

  consoleNoiseFilterInstalled = true;
}

export function sayLog(message, ...extra) {
  writeLog("TALK", COLORS.talk, message, ...extra);
}

export function inputLog(message, ...extra) {
  writeLog("INPUT", COLORS.input, message, ...extra);
}

export function infoLog(message, ...extra) {
  writeLog("INFO", COLORS.info, message, ...extra);
}

export function successLog(message, ...extra) {
  writeLog("SUCCESS", COLORS.success, message, ...extra);
}

export function errorLog(message, ...extra) {
  writeLog("ERROR", COLORS.error, message, ...extra);
}

export function warningLog(message, ...extra) {
  writeLog("WARNING", COLORS.warning, message, ...extra);
}

export function bannerLog() {
  console.log(`${COLORS.talk}░█▀█░█░░░█░█░█▀█░░█▀▄░█▀█░▀█▀${RESET}`);
  console.log("░█▀█░█░░░░█░░█▀█░░█▀▄░█░█░░█░");
  console.log(`${COLORS.talk}░▀░▀░▀▀▀░░▀░░▀░▀░░▀▀░░▀▀▀░░▀░${RESET}`);
  console.log(`${COLORS.talk}🤍 Versão: ${RESET}${pkg.version}\n`);
}
