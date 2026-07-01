import { connect } from "./connection.js";
import { load } from "./loader.js";
import { badMacHandler } from "./utils/badMacHandler.js";
import {
  bannerLog,
  errorLog,
  infoLog,
  installConsoleNoiseFilter,
  warningLog,
} from "./utils/logger.js";

const BAD_MAC_HEALTH_CHECK_INTERVAL_MS = 300_000;
const BAD_MAC_RESTART_DELAY_MS = 5_000;

function registerProcessErrorHandlers() {
  process.on("uncaughtException", (error) => {
    if (badMacHandler.handleError(error, "uncaughtException")) {
      return;
    }

    errorLog(`Erro crítico não capturado: ${error.message}`);
    errorLog(error.stack);

    if (
      !error.message.includes("ENOTFOUND") &&
      !error.message.includes("timeout")
    ) {
      process.exit(1);
    }
  });

  process.on("unhandledRejection", (reason) => {
    if (badMacHandler.handleError(reason, "unhandledRejection")) {
      return;
    }

    errorLog("Promessa rejeitada não tratada:", reason);
  });
}

function reportBadMacStats() {
  const stats = badMacHandler.getStats();

  if (stats.errorCount > 0) {
    warningLog(
      `BadMacHandler stats: ${stats.errorCount}/${stats.maxRetries} erros`,
    );
  }
}

function scheduleBadMacHealthReport() {
  setInterval(reportBadMacStats, BAD_MAC_HEALTH_CHECK_INTERVAL_MS);
}

async function startAlyaBot() {
  try {
    process.setMaxListeners(1500);

    bannerLog();
    infoLog("Inicializando núcleo da Alya Bot...");

    reportBadMacStats();

    const socket = await connect();

    load(socket);
    scheduleBadMacHealthReport();
  } catch (error) {
    if (badMacHandler.handleError(error, "bot-startup")) {
      warningLog("Erro Bad MAC durante inicialização. Tentando novamente...");

      setTimeout(() => {
        startAlyaBot();
      }, BAD_MAC_RESTART_DELAY_MS);

      return;
    }

    errorLog(`Erro ao iniciar a Alya Bot: ${error.message}`);
    errorLog(error.stack);
    process.exit(1);
  }
}

installConsoleNoiseFilter();
registerProcessErrorHandlers();
startAlyaBot();
