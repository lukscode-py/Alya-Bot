import fs from "node:fs";
import path from "node:path";
import { errorLog, warningLog } from "./logger.js";

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_RESET_INTERVAL_MS = 5 * 60 * 1000;

const BAD_MAC_SIGNATURES = [
  "Bad MAC",
  "MAC verification failed",
  "decryption failed",
];

const SESSION_ERROR_SIGNATURES = ["Session", "signal protocol", "decrypt"];

const PRESERVED_SESSION_FILE_PATTERNS = [
  "app-state-sync-key",
  "app-state-sync-version",
];

function stringifyError(error) {
  return error?.message || error?.toString() || "";
}

function getBaileysAuthFolder() {
  return path.resolve(process.cwd(), "assets", "auth", "baileys");
}

function shouldPreserveSessionFile(file) {
  return (
    file === "creds.json" ||
    PRESERVED_SESSION_FILE_PATTERNS.some((pattern) => file.includes(pattern))
  );
}

class BadMacHandler {
  constructor({
    maxRetries = DEFAULT_MAX_RETRIES,
    resetInterval = DEFAULT_RESET_INTERVAL_MS,
  } = {}) {
    this.errorCount = 0;
    this.maxRetries = maxRetries;
    this.resetInterval = resetInterval;
    this.lastReset = Date.now();
  }

  isBadMacError(error) {
    const errorMessage = stringifyError(error);

    return BAD_MAC_SIGNATURES.some((signature) =>
      errorMessage.includes(signature),
    );
  }

  isSessionError(error) {
    const errorMessage = stringifyError(error);

    return (
      SESSION_ERROR_SIGNATURES.some((signature) =>
        errorMessage.includes(signature),
      ) || this.isBadMacError(error)
    );
  }

  clearProblematicSessionFiles() {
    try {
      const baileysFolder = getBaileysAuthFolder();

      if (!fs.existsSync(baileysFolder)) {
        return false;
      }

      const files = fs.readdirSync(baileysFolder);
      let removedCount = 0;

      for (const file of files) {
        const filePath = path.join(baileysFolder, file);

        if (!fs.statSync(filePath).isFile()) {
          continue;
        }

        if (shouldPreserveSessionFile(file)) {
          continue;
        }

        if (!file.includes("session")) {
          continue;
        }

        fs.unlinkSync(filePath);
        removedCount++;
      }

      if (removedCount > 0) {
        warningLog(
          `${removedCount} arquivos de sessão problemáticos removidos. Credenciais principais preservadas.`,
        );
        return true;
      }

      return false;
    } catch (error) {
      errorLog(`Erro ao limpar arquivos de sessão: ${error.message}`);
      return false;
    }
  }

  incrementErrorCount() {
    this.errorCount++;
    errorLog(`Bad MAC error count: ${this.errorCount}/${this.maxRetries}`);

    if (Date.now() - this.lastReset > this.resetInterval) {
      this.resetErrorCount();
    }
  }

  resetErrorCount() {
    const previousCount = this.errorCount;
    this.errorCount = 0;
    this.lastReset = Date.now();

    if (previousCount > 0) {
      warningLog(
        `Reset do contador de Bad MAC errors. Contador anterior: ${previousCount}`,
      );
    }
  }

  hasReachedLimit() {
    return this.errorCount >= this.maxRetries;
  }

  handleError(error, context = "unknown") {
    if (!this.isBadMacError(error)) {
      return false;
    }

    errorLog(`Bad MAC error detectado em ${context}: ${error.message}`);
    this.incrementErrorCount();

    if (this.hasReachedLimit()) {
      warningLog(
        `Limite de Bad MAC errors atingido (${this.maxRetries}). Considere reiniciar o bot.`,
      );
      return true;
    }

    warningLog(
      `Ignorando Bad MAC error e continuando operação... (${this.errorCount}/${this.maxRetries})`,
    );
    return true;
  }

  createSafeWrapper(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        if (this.handleError(error, context)) {
          return null;
        }

        throw error;
      }
    };
  }

  getStats() {
    return {
      errorCount: this.errorCount,
      maxRetries: this.maxRetries,
      lastReset: new Date(this.lastReset).toISOString(),
      timeUntilReset: Math.max(
        0,
        this.resetInterval - (Date.now() - this.lastReset),
      ),
    };
  }
}

const badMacHandler = new BadMacHandler();

export { BadMacHandler, badMacHandler };
