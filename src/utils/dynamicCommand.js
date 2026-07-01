import { BOT_EMOJI, ONLY_GROUP_ID } from "../config.js";
import {
  DangerError,
  InvalidParameterError,
  WarningError,
} from "../errors/index.js";
import {
  checkPermission,
  hasTypeAndCommand,
  isAdmin,
  isBotOwner,
  isLink,
  verifyPrefix,
} from "../middlewares/index.js";
import { processAutoSticker } from "../services/sticker.js";
import { badMacHandler } from "./badMacHandler.js";
import {
  getAutoResponderResponse,
  getPrefix,
  isActiveAntiLinkGroup,
  isActiveAutoResponderGroup,
  isActiveAutoStickerGroup,
  isActiveGroup,
  isActiveOnlyAdmins,
} from "./database.js";
import { findCommandImport } from "./index.js";
import { errorLog } from "./logger.js";
import {
  formatRemoteCallErrorMessage,
  getRemoteServiceLabelFromUrl,
} from "./remote-service.js";

async function handleAntiLink({ activeGroup, paramsHandler }) {
  const {
    fullMessage,
    remoteJid,
    sendReply,
    socket,
    userLid,
    webMessage,
  } = paramsHandler;

  if (!activeGroup || !isActiveAntiLinkGroup(remoteJid) || !isLink(fullMessage)) {
    return false;
  }

  if (!userLid || (await isAdmin({ remoteJid, userLid, socket }))) {
    return false;
  }

  await socket.groupParticipantsUpdate(remoteJid, [userLid], "remove");
  await sendReply("Anti-link ativado! Você foi removido por enviar um link!");

  await socket.sendMessage(remoteJid, {
    delete: {
      remoteJid,
      fromMe: false,
      id: webMessage.key.id,
      participant: webMessage.key.participant,
    },
  });

  return true;
}

async function handleAutoSticker({ activeGroup, paramsHandler }) {
  if (!activeGroup || !isActiveAutoStickerGroup(paramsHandler.remoteJid)) {
    return false;
  }

  return processAutoSticker(paramsHandler);
}

async function handleAutoResponder({ fullMessage, remoteJid, sendReply }) {
  if (!isActiveAutoResponderGroup(remoteJid)) {
    return;
  }

  const response = getAutoResponderResponse(fullMessage);

  if (response) {
    await sendReply(response);
  }
}

async function handlePrefixHelp({ fullMessage, remoteJid, sendReact, sendReply }) {
  if (!fullMessage.toLocaleLowerCase().includes("prefixo")) {
    return;
  }

  await sendReact(BOT_EMOJI);

  const groupPrefix = getPrefix(remoteJid);
  await sendReply(
    `O padrão é: ${groupPrefix}\nUse ${groupPrefix}menu para ver os comandos disponíveis!`,
  );
}

async function handleUnknownGroupMessage({
  command,
  fullMessage,
  prefix,
  remoteJid,
  sendReact,
  sendReply,
  type,
}) {
  if (verifyPrefix(prefix, remoteJid) && hasTypeAndCommand({ type, command })) {
    return false;
  }

  await handleAutoResponder({ fullMessage, remoteJid, sendReply });
  await handlePrefixHelp({ fullMessage, remoteJid, sendReact, sendReply });

  return true;
}

async function hasCommandPermission({ activeGroup, paramsHandler, type }) {
  const { remoteJid, sendErrorReply, sendWarningReply, socket, userLid } =
    paramsHandler;

  if (!(await checkPermission({ type, ...paramsHandler }))) {
    await sendErrorReply("Você não tem permissão para executar este comando!");
    return false;
  }

  if (
    activeGroup &&
    isActiveOnlyAdmins(remoteJid) &&
    !(await isAdmin({ remoteJid, userLid, socket }))
  ) {
    await sendWarningReply("Somente administradores podem executar comandos!");
    return false;
  }

  return true;
}

async function handleInactivePrivateUsage({ command, paramsHandler, type }) {
  const { prefix, remoteJid, sendErrorReply, sendWarningReply, userLid } =
    paramsHandler;

  if (isBotOwner({ userLid }) || isActiveGroup(remoteJid)) {
    return false;
  }

  if (!verifyPrefix(prefix, remoteJid) || !hasTypeAndCommand({ type, command })) {
    return true;
  }

  if (command.name !== "on") {
    await sendWarningReply(
      "Este grupo está desativado! Peça para o dono do grupo ativar o bot!",
    );
    return true;
  }

  if (!(await checkPermission({ type, ...paramsHandler }))) {
    await sendErrorReply("Você não tem permissão para executar este comando!");
    return true;
  }

  return false;
}

async function handleExactPrefixMessage({ fullMessage, remoteJid, sendReact, sendReply }) {
  const groupPrefix = getPrefix(remoteJid);

  if (fullMessage !== groupPrefix) {
    return false;
  }

  await sendReact(BOT_EMOJI);
  await sendReply(
    `Este é meu prefixo! Use ${groupPrefix}menu para ver os comandos disponíveis!`,
  );

  return true;
}

async function handleMissingCommand({ command, remoteJid, sendWarningReply, type }) {
  if (hasTypeAndCommand({ type, command })) {
    return false;
  }

  const groupPrefix = getPrefix(remoteJid);
  await sendWarningReply(
    `Comando não encontrado! Use ${groupPrefix}menu para ver os comandos disponíveis!`,
  );

  return true;
}

function getAxiosErrorDetails(error) {
  return error.response?.data?.message || error.message || "Erro desconhecido";
}

async function handleCommandError({ command, error, sendErrorReply, sendWarningReply }) {
  if (badMacHandler.handleError(error, `command:${command?.name}`)) {
    await sendWarningReply(
      "Erro temporário de sincronização. Tente novamente em alguns segundos.",
    );
    return;
  }

  if (badMacHandler.isSessionError(error)) {
    errorLog(
      `Erro de sessão durante execução de comando ${command?.name}: ${error.message}`,
    );
    await sendWarningReply("Erro de comunicação. Tente executar o comando novamente.");
    return;
  }

  if (error instanceof InvalidParameterError) {
    await sendWarningReply(`Parâmetros inválidos! ${error.message}`);
    return;
  }

  if (error instanceof WarningError) {
    await sendWarningReply(error.message);
    return;
  }

  if (error instanceof DangerError) {
    await sendErrorReply(error.message);
    return;
  }

  if (error.isAxiosError) {
    await sendErrorReply(
      formatRemoteCallErrorMessage({
        commandName: command.name,
        serviceName: getRemoteServiceLabelFromUrl(error.config?.url),
        details: getAxiosErrorDetails(error),
      }),
    );
    return;
  }

  errorLog("Erro ao executar comando", error);
  await sendErrorReply(`Ocorreu um erro ao executar o comando ${command.name}!

📄 *Detalhes*: ${error.message}`);
}

/**
 * @param {CommandHandleProps} paramsHandler
 * @param {number} startProcess
 */
export async function dynamicCommand(paramsHandler, startProcess) {
  const {
    commandName,
    fullMessage,
    prefix,
    remoteJid,
    sendErrorReply,
    sendReact,
    sendReply,
    sendWarningReply,
  } = paramsHandler;

  const activeGroup = isActiveGroup(remoteJid);

  if (await handleAntiLink({ activeGroup, paramsHandler })) {
    return;
  }

  if (await handleAutoSticker({ activeGroup, paramsHandler })) {
    return;
  }

  const { type, command } = await findCommandImport(commandName);

  if (ONLY_GROUP_ID && ONLY_GROUP_ID !== remoteJid) {
    return;
  }

  if (
    activeGroup &&
    (await handleUnknownGroupMessage({
      command,
      fullMessage,
      prefix,
      remoteJid,
      sendReact,
      sendReply,
      type,
    }))
  ) {
    return;
  }

  if (
    activeGroup &&
    !(await hasCommandPermission({ activeGroup, paramsHandler, type }))
  ) {
    return;
  }

  if (await handleInactivePrivateUsage({ command, paramsHandler, type })) {
    return;
  }

  if (!verifyPrefix(prefix, remoteJid)) {
    return;
  }

  if (
    await handleExactPrefixMessage({
      fullMessage,
      remoteJid,
      sendReact,
      sendReply,
    })
  ) {
    return;
  }

  if (await handleMissingCommand({ command, remoteJid, sendWarningReply, type })) {
    return;
  }

  try {
    await command.handle({
      ...paramsHandler,
      type,
      startProcess,
    });
  } catch (error) {
    await handleCommandError({
      command,
      error,
      sendErrorReply,
      sendWarningReply,
    });
  }
}
