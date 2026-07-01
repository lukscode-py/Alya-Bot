import { BOT_LID, OWNER_LID } from "../config.js";
import {
  applyAntiPaymentRestriction,
  handleQuotedPaymentRestriction,
} from "../utils/antiPaymentAction.js";
import {
  readGroupRestrictions,
  readRestrictedMessageTypes,
} from "../utils/database.js";
import { hasGroupStatusMessage } from "../utils/groupStatusMessage.js";
import { hasDirectMedia } from "../utils/index.js";
import { errorLog } from "../utils/logger.js";
import { hasPaymentMessage } from "../utils/paymentMessage.js";
import { isAdmin } from "./index.js";

function getGroupMessageContext(webMessage) {
  if (!webMessage?.key) {
    return null;
  }

  const { remoteJid, fromMe, id: messageId } = webMessage.key;

  if (!remoteJid?.endsWith("@g.us") || fromMe) {
    return null;
  }

  const userLid = webMessage.key.participant || webMessage.key.participantAlt;

  if (!userLid) {
    return null;
  }

  return { remoteJid, fromMe, messageId, userLid };
}

async function shouldIgnorePrivilegedSender({ socket, remoteJid, userLid }) {
  if (userLid === OWNER_LID || userLid === BOT_LID) {
    return true;
  }

  return isAdmin({ remoteJid, userLid, socket });
}

function buildDeleteKey({ remoteJid, fromMe = false, messageId, userLid }) {
  return {
    remoteJid,
    fromMe,
    id: messageId,
    participant: userLid,
  };
}

async function applyAntiPaymentIfNeeded({
  socket,
  remoteJid,
  userLid,
  messageId,
  webMessage,
  isActive,
}) {
  if (!isActive) {
    return false;
  }

  if (hasPaymentMessage(webMessage)) {
    await applyAntiPaymentRestriction({
      socket,
      remoteJid,
      userLid,
      messageKey: buildDeleteKey({ remoteJid, messageId, userLid }),
    });

    return true;
  }

  return handleQuotedPaymentRestriction({ socket, remoteJid, webMessage });
}

async function applyAntiStatusGroupIfNeeded({
  socket,
  remoteJid,
  userLid,
  webMessage,
  isActive,
}) {
  if (!isActive || !hasGroupStatusMessage(webMessage)) {
    return false;
  }

  try {
    await socket.groupParticipantsUpdate(remoteJid, [userLid], "remove");
    await socket.sendMessage(remoteJid, { delete: webMessage.key });
  } catch (error) {
    errorLog(
      `Erro ao aplicar anti-status-grupo. Verifique se eu estou como admin do grupo! Detalhes: ${error.message}`,
    );
  }

  return true;
}

async function deleteRestrictedMediaIfNeeded({
  socket,
  remoteJid,
  fromMe,
  userLid,
  messageId,
  webMessage,
  restrictions,
}) {
  const messageType = Object.keys(readRestrictedMessageTypes()).find((type) =>
    hasDirectMedia(webMessage, type),
  );

  if (!messageType || !restrictions[`anti-${messageType}`]) {
    return false;
  }

  await socket.sendMessage(remoteJid, {
    delete: buildDeleteKey({ remoteJid, fromMe, messageId, userLid }),
  });

  return true;
}

export async function messageHandler(socket, webMessage) {
  try {
    const context = getGroupMessageContext(webMessage);

    if (!context) {
      return;
    }

    const { remoteJid, fromMe, messageId, userLid } = context;

    if (await shouldIgnorePrivilegedSender({ socket, remoteJid, userLid })) {
      return;
    }

    const antiGroups = readGroupRestrictions();
    const restrictions = antiGroups[remoteJid] || {};

    if (
      await applyAntiPaymentIfNeeded({
        socket,
        remoteJid,
        userLid,
        messageId,
        webMessage,
        isActive: !!restrictions["anti-payment"],
      })
    ) {
      return;
    }

    if (
      await applyAntiStatusGroupIfNeeded({
        socket,
        remoteJid,
        userLid,
        webMessage,
        isActive: !!restrictions["anti-status-grupo"],
      })
    ) {
      return;
    }

    await deleteRestrictedMediaIfNeeded({
      socket,
      remoteJid,
      fromMe,
      userLid,
      messageId,
      webMessage,
      restrictions,
    });
  } catch (error) {
    errorLog(
      `Erro ao processar mensagem restrita. Verifique se eu estou como admin do grupo! Detalhes: ${error.message}`,
    );
  }
}
