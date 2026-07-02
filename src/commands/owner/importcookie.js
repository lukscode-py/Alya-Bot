import { downloadMediaMessage } from "baileys";

import { PREFIX } from "../../config.js";
import { InvalidParameterError, WarningError } from "../../errors/index.js";
import {
  listCookieTypes,
  normalizeCookieType,
  saveCookieText,
  validateCookieText,
} from "../../services/cookie-service.js";
import { errorLog } from "../../utils/logger.js";

const MAX_COOKIE_BYTES = 2 * 1024 * 1024;

function unwrapMessage(message) {
  let current = message;

  for (let index = 0; index < 6; index += 1) {
    if (!current) {
      return null;
    }

    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
      continue;
    }

    if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
      continue;
    }

    if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
      continue;
    }

    if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
      continue;
    }

    return current;
  }

  return current;
}

function getQuotedMessage(webMessage) {
  const message = unwrapMessage(webMessage?.message);
  const contextInfo =
    message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.documentMessage?.contextInfo;

  if (!contextInfo?.quotedMessage) {
    return null;
  }

  return {
    key: {
      remoteJid: webMessage?.key?.remoteJid,
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
      fromMe: false,
    },
    message: contextInfo.quotedMessage,
  };
}

function hasDocumentMessage(webMessage) {
  const message = unwrapMessage(webMessage?.message);

  return Boolean(message?.documentMessage);
}

async function tryReadCookieAttachment(webMessage) {
  const candidates = [webMessage, getQuotedMessage(webMessage)].filter(Boolean);

  for (const candidate of candidates) {
    if (!hasDocumentMessage(candidate)) {
      continue;
    }

    const buffer = await downloadMediaMessage(candidate, "buffer", {});

    if (!buffer?.length) {
      continue;
    }

    if (buffer.length > MAX_COOKIE_BYTES) {
      throw new WarningError("O arquivo de cookie é grande demais.");
    }

    return buffer.toString("utf8");
  }

  return "";
}

function parseArgs(fullArgs) {
  const text = String(fullArgs || "").trim();

  if (!text) {
    return {
      rawType: "",
      cookieText: "",
    };
  }

  const firstSpaceIndex = text.search(/\s/);

  if (firstSpaceIndex === -1) {
    return {
      rawType: text,
      cookieText: "",
    };
  }

  return {
    rawType: text.slice(0, firstSpaceIndex).trim(),
    cookieText: text.slice(firstSpaceIndex + 1).trim(),
  };
}

function usageMessage() {
  return `Use assim:

${PREFIX}importcookie youtube <cookie colado>
${PREFIX}importcookie instagram <cookie colado>
${PREFIX}importcookie tiktok <cookie colado>
${PREFIX}importcookie pinterest <cookie colado>

Ou envie/marque um arquivo cookies.txt e use:
${PREFIX}importcookie youtube

Tipos disponíveis:
${listCookieTypes().join(", ")}`;
}

export default {
  name: "importcookie",
  description: "Importa cookies.txt para yt-dlp usar em downloads bloqueados.",
  commands: ["importcookie", "import-cookie", "importcookies", "import-cookies"],
  usage: `${PREFIX}importcookie youtube <cookies.txt>`,
  ownerOnly: true,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, webMessage, sendReply, sendErrorReply }) => {
    const { rawType, cookieText: pastedCookieText } = parseArgs(fullArgs);
    const type = normalizeCookieType(rawType);

    if (!rawType) {
      throw new InvalidParameterError(
        `Você precisa informar o tipo do cookie.\n\n${usageMessage()}`,
      );
    }

    if (!type) {
      throw new InvalidParameterError(
        `Tipo de cookie inválido: ${rawType}\n\n${usageMessage()}`,
      );
    }

    try {
      const attachmentCookieText = await tryReadCookieAttachment(webMessage);
      const cookieText = attachmentCookieText || pastedCookieText;

      if (!cookieText) {
        throw new InvalidParameterError(
          `Você precisa colar o cookies.txt ou enviar/marcar o arquivo cookies.txt.\n\n${usageMessage()}`,
        );
      }

      const validation = validateCookieText(type, cookieText);

      if (!validation.ok) {
        throw new WarningError(
          `Cookie inválido para ${type}.\n\nMotivo: ${validation.reason}`,
        );
      }

      const result = saveCookieText(type, cookieText);

      if (!result.ok) {
        throw new WarningError(
          `Cookie inválido para ${type}.\n\nMotivo: ${result.reason}`,
        );
      }

      await sendReply(
        `✅ Cookie de ${result.displayName} definido com sucesso!

Arquivo:
${result.path}

Cookies encontrados:
${result.cookieCount}

Cookies compatíveis com ${result.displayName}:
${result.domainCookieCount}

O bot já vai usar esse cookie automaticamente quando o site bloquear download sem cookie.`,
      );
    } catch (error) {
      errorLog(error?.stack || error?.message || String(error));

      if (error instanceof InvalidParameterError || error instanceof WarningError) {
        throw error;
      }

      await sendErrorReply(
        error?.message || "Não foi possível importar esse cookie.",
      );
    }
  },
};
