import { BOT_LID, OWNER_LID } from "../config.js";
import { errorLog } from "./logger.js";
import { verifyQuotedAuthor } from "./messageEnvelopeRegistry.js";
import { defendAgainstPayment } from "./paymentDefenseState.js";
import { getQuotedPaymentContext } from "./paymentMessage.js";

export function applyAntiPaymentRestriction({
  socket,
  remoteJid,
  userLid,
  messageKey,
}) {
  return defendAgainstPayment({ socket, remoteJid, userLid, messageKey });
}

function isProtectedAuthor(authorLid) {
  return authorLid === BOT_LID || authorLid === OWNER_LID;
}

function buildQuotedDeleteKey({ remoteJid, quotedPayment, authorLid }) {
  if (!quotedPayment.stanzaId) {
    return undefined;
  }

  return {
    remoteJid,
    fromMe: false,
    id: quotedPayment.stanzaId,
    participant: authorLid,
  };
}

function logUntrustedQuote({ authorLid, contradicted }) {
  errorLog(
    `[anti-payment] Marcação não corroborada pelo registro (${
      contradicted ? "forja detectada" : "mensagem original não vista"
    }). Autor ${authorLid} preservado.`,
  );
}

async function getAuthorModerationStatus({ socket, remoteJid, authorLid }) {
  try {
    const { participants, owner } = await socket.groupMetadata(remoteJid);
    const authorParticipant = participants.find(
      (participant) => participant.id === authorLid,
    );

    return {
      inGroup: Boolean(authorParticipant),
      isAdmin:
        authorParticipant?.admin === "admin" ||
        authorParticipant?.admin === "superadmin" ||
        authorLid === owner,
    };
  } catch (error) {
    errorLog(
      `Erro ao validar autor da marcação de pagamento. Detalhes: ${error.message}`,
    );

    return { inGroup: false, isAdmin: false };
  }
}

export async function handleQuotedPaymentRestriction({
  socket,
  remoteJid,
  webMessage,
}) {
  const quotedPayment = getQuotedPaymentContext(webMessage);

  if (!quotedPayment?.participant) {
    return false;
  }

  const authorLid = quotedPayment.participant;

  if (isProtectedAuthor(authorLid)) {
    return false;
  }

  const { corroborated, contradicted } = verifyQuotedAuthor({
    groupJid: remoteJid,
    stanzaId: quotedPayment.stanzaId,
    participant: authorLid,
  });

  if (!corroborated) {
    logUntrustedQuote({ authorLid, contradicted });
    return false;
  }

  const authorStatus = await getAuthorModerationStatus({
    socket,
    remoteJid,
    authorLid,
  });

  if (!authorStatus.inGroup || authorStatus.isAdmin) {
    return false;
  }

  await applyAntiPaymentRestriction({
    socket,
    remoteJid,
    userLid: authorLid,
    messageKey: buildQuotedDeleteKey({ remoteJid, quotedPayment, authorLid }),
  });

  return true;
}
