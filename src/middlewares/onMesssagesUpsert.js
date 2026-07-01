import { DEVELOPER_MODE } from "../config.js";
import { badMacHandler } from "../utils/badMacHandler.js";
import { checkIfMemberIsMuted } from "../utils/database.js";
import { dynamicCommand } from "../utils/dynamicCommand.js";
import {
  GROUP_PARTICIPANT_ADD,
  GROUP_PARTICIPANT_LEAVE,
  isAddOrLeave,
  isAtLeastMinutesInPast,
} from "../utils/index.js";
import { loadCommonFunctions } from "../utils/loadCommonFunctions.js";
import { errorLog, infoLog } from "../utils/logger.js";
import { recordMessageEnvelope } from "../utils/messageEnvelopeRegistry.js";
import { hasPaymentMessage } from "../utils/paymentMessage.js";
import { handleAfkReferences } from "./afkHandler.js";
import { customMiddleware } from "./customMiddleware.js";
import { messageHandler } from "./messageHandler.js";
import { onGroupParticipantsUpdate } from "./onGroupParticipantsUpdate.js";

function logDeveloperMessages(messages) {
  if (!DEVELOPER_MODE) {
    return;
  }

  infoLog(
    `\n\n⪨========== [ MENSAGEM RECEBIDA ] ==========⪩ \n\n${JSON.stringify(
      messages,
      null,
      2,
    )}`,
  );
}

function resolveParticipantAction(messageStubType) {
  if (messageStubType === GROUP_PARTICIPANT_ADD) {
    return "add";
  }

  if (messageStubType === GROUP_PARTICIPANT_LEAVE) {
    return "remove";
  }

  return "";
}

async function processParticipantEvent({ socket, webMessage }) {
  if (!isAddOrLeave.includes(webMessage.messageStubType)) {
    return false;
  }

  const action = resolveParticipantAction(webMessage.messageStubType);
  const data = webMessage.messageStubParameters[0];

  await customMiddleware({
    socket,
    webMessage,
    type: "participant",
    action,
    data,
    commonFunctions: null,
  });

  await onGroupParticipantsUpdate({
    data,
    remoteJid: webMessage.key.remoteJid,
    socket,
    action,
  });

  return true;
}

function getMutedParticipantLid(webMessage) {
  return webMessage?.key?.participant?.replace(/:[0-9][0-9]|:[0-9]/g, "");
}

async function deleteMutedMemberMessage({ socket, webMessage }) {
  const { id, remoteJid, participant } = webMessage.key;

  await socket.sendMessage(remoteJid, {
    delete: {
      remoteJid,
      fromMe: false,
      id,
      participant,
    },
  });
}

async function processMutedMemberMessage({ socket, webMessage }) {
  const remoteJid = webMessage?.key?.remoteJid;
  const participantLid = getMutedParticipantLid(webMessage);

  if (!checkIfMemberIsMuted(remoteJid, participantLid)) {
    return false;
  }

  try {
    await deleteMutedMemberMessage({ socket, webMessage });
  } catch (error) {
    errorLog(
      `Erro ao deletar mensagem de membro silenciado, provavelmente eu não sou administrador do grupo! ${error.message}`,
    );
  }

  return true;
}

async function processRegularMessage({ socket, webMessage, startProcess }) {
  const commonFunctions = loadCommonFunctions({ socket, webMessage });

  if (!commonFunctions) {
    return;
  }

  await customMiddleware({
    socket,
    webMessage,
    type: "message",
    commonFunctions,
  });

  await handleAfkReferences({ webMessage, commonFunctions });
  await dynamicCommand(commonFunctions, startProcess);
}

function recordMessageForSafety(webMessage) {
  recordMessageEnvelope(webMessage, hasPaymentMessage(webMessage));
}

function handleProcessingError(error) {
  if (badMacHandler.handleError(error, "message-processing")) {
    return;
  }

  if (badMacHandler.isSessionError(error)) {
    errorLog(`Erro de sessão ao processar mensagem: ${error.message}`);
    return;
  }

  errorLog(
    `Erro ao processar mensagem: ${error.message} | Stack: ${error.stack}`,
  );
}

export async function onMessagesUpsert({ socket, messages, startProcess }) {
  if (!messages.length) {
    return;
  }

  for (const webMessage of messages) {
    logDeveloperMessages(messages);

    try {
      recordMessageForSafety(webMessage);

      if (webMessage?.message) {
        void messageHandler(socket, webMessage);
      }

      if (isAtLeastMinutesInPast(webMessage.messageTimestamp)) {
        continue;
      }

      if (await processParticipantEvent({ socket, webMessage })) {
        return;
      }

      if (await processMutedMemberMessage({ socket, webMessage })) {
        return;
      }

      await processRegularMessage({ socket, webMessage, startProcess });
    } catch (error) {
      handleProcessingError(error);
      continue;
    }
  }
}
