import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidNewsletter,
  isJidStatusBroadcast,
  useMultiFileAuthState,
} from "baileys";
import NodeCache from "node-cache";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import { PREFIX, TEMP_DIR } from "./config.js";
import { load } from "./loader.js";
import { badMacHandler } from "./utils/badMacHandler.js";
import { onlyNumbers, question } from "./utils/index.js";
import {
  bannerLog,
  errorLog,
  infoLog,
  successLog,
  warningLog,
} from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, "..", "assets", "auth", "baileys");
const WA_LOG_FILE = path.join(TEMP_DIR, "wa-logs.txt");

const msgRetryCounterCache = new NodeCache();

function ensureRuntimeDirectories() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

function createBaileysLogger() {
  const logger = pino(
    { timestamp: () => `,"time":"${new Date().toJSON()}"` },
    pino.destination(WA_LOG_FILE),
  );

  logger.level = "error";

  return logger;
}

function formatPairingCode(code) {
  if (!code) {
    return code;
  }

  return code.match(/.{1,4}/g)?.join("-") || code;
}

function clearScreenWithBanner() {
  console.clear();
  bannerLog();
}

function shouldIgnoreJid(jid) {
  return isJidBroadcast(jid) || isJidStatusBroadcast(jid) || isJidNewsletter(jid);
}

function createSocket({ state, version, logger }) {
  return makeWASocket({
    version,
    logger,
    defaultQueryTimeoutMs: undefined,
    retryRequestDelayMs: 5000,
    auth: state,
    shouldIgnoreJid,
    connectTimeoutMs: 20_000,
    keepAliveIntervalMs: 30_000,
    maxMsgRetryCount: 5,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    emitOwnEvents: false,
    msgRetryCounterCache,
    shouldSyncHistoryMessage: () => false,
  });
}

async function requestPairingIfNeeded(socket) {
  if (socket.authState.creds.registered) {
    return;
  }

  clearScreenWithBanner();
  console.log(
    'Informe o número do bot (SP/RJ exigem 9º dígito). \nExemplo: "+5511912345678", demais estados: "+554112345678":',
  );

  const phoneNumber = await question("Número: ");

  if (!phoneNumber) {
    errorLog(
      'Número de telefone inválido! Tente novamente com o comando "npm start".',
    );

    process.exit(1);
  }

  const code = await socket.requestPairingCode(onlyNumbers(phoneNumber));

  console.log(`Código de pareamento: ${formatPairingCode(code)}`);
}

function handleBadMacDisconnect(error) {
  if (
    !error?.message?.includes("Bad MAC") &&
    !error?.toString()?.includes("Bad MAC")
  ) {
    return false;
  }

  errorLog("Bad MAC error na desconexão detectado");

  if (!badMacHandler.handleError(error, "connection.update")) {
    return false;
  }

  if (!badMacHandler.hasReachedLimit()) {
    return true;
  }

  warningLog(
    "Limite de erros Bad MAC atingido. Limpando arquivos de sessão problemáticos...",
  );
  badMacHandler.clearProblematicSessionFiles();
  badMacHandler.resetErrorCount();

  return true;
}

function handleBadSession() {
  warningLog("Sessão inválida!");

  const sessionError = new Error("Bad session detected");

  if (!badMacHandler.handleError(sessionError, "badSession")) {
    return;
  }

  if (badMacHandler.hasReachedLimit()) {
    warningLog("Limite de erros de sessão atingido. Limpando arquivos de sessão...");
    badMacHandler.clearProblematicSessionFiles();
    badMacHandler.resetErrorCount();
  }
}

function logDisconnectReason(statusCode) {
  switch (statusCode) {
    case DisconnectReason.badSession:
      handleBadSession();
      break;
    case DisconnectReason.connectionClosed:
      warningLog("Conexão fechada!");
      break;
    case DisconnectReason.connectionLost:
      warningLog("Conexão perdida!");
      break;
    case DisconnectReason.connectionReplaced:
      warningLog("Conexão substituída!");
      break;
    case DisconnectReason.multideviceMismatch:
      warningLog("Dispositivo incompatível!");
      break;
    case DisconnectReason.forbidden:
      warningLog("Conexão proibida!");
      break;
    case DisconnectReason.restartRequired:
      infoLog('Me reinicie por favor! Digite "npm start".');
      break;
    case DisconnectReason.unavailableService:
      warningLog("Serviço indisponível!");
      break;
    default:
      warningLog(`Conexão encerrada com código: ${statusCode ?? "desconhecido"}`);
      break;
  }
}

async function reconnect() {
  const newSocket = await connect();
  load(newSocket);
}

async function handleClosedConnection(lastDisconnect) {
  const error = lastDisconnect?.error;
  const statusCode = error?.output?.statusCode;

  const handledBadMac = handleBadMacDisconnect(error);

  if (handledBadMac && badMacHandler.hasReachedLimit()) {
    await reconnect();
    return;
  }

  if (statusCode === DisconnectReason.loggedOut) {
    errorLog("Bot desconectado!");
    return;
  }

  logDisconnectReason(statusCode);
  await reconnect();
}

function handleOpenConnection(version) {
  clearScreenWithBanner();
  successLog("✅ Alya Bot iniciada com sucesso!");
  successLog("Fui conectada com sucesso!");
  infoLog("Versão do WhatsApp Web: " + version.join("."));
  successLog(
    `✅ Estou pronta para uso!
Verifique o prefixo, digitando a palavra "prefixo" no WhatsApp.
O prefixo padrão definido no config.js é ${PREFIX}`,
  );
  badMacHandler.resetErrorCount();
}

function listenConnectionUpdates(socket, version) {
  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      await handleClosedConnection(lastDisconnect);
      return;
    }

    if (connection === "open") {
      handleOpenConnection(version);
      return;
    }

    if (connection === "connecting") {
      infoLog("Conectando...");
      return;
    }

    infoLog("Atualizando conexão...");
  });
}

export async function connect() {
  ensureRuntimeDirectories();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  const logger = createBaileysLogger();
  const socket = createSocket({ state, version, logger });

  await requestPairingIfNeeded(socket);

  listenConnectionUpdates(socket, version);
  socket.ev.on("creds.update", saveCreds);

  return socket;
}
