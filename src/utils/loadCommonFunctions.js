import { delay } from "baileys";
import fs from "node:fs";
import { BOT_EMOJI, TIMEOUT_IN_MILLISECONDS_BY_EVENT } from "../config.js";
import {
  ajustAudioByBuffer,
  baileysIs,
  download,
  extractDataFromMessage,
  onlyNumbers,
  removeFileWithTimeout,
} from "./index.js";

function cloneQuotedMessage(webMessage) {
  return JSON.parse(JSON.stringify(webMessage));
}

function buildQuotedOptions(webMessage, quoted = true) {
  return quoted ? { quoted: cloneQuotedMessage(webMessage) } : {};
}

function buildUrlSendOptions(webMessage, url, quoted = true) {
  return { url, ...buildQuotedOptions(webMessage, quoted) };
}

function buildMentionOptions(mentions) {
  return mentions?.length ? { mentions } : {};
}

function formatBotText(text) {
  return `${BOT_EMOJI} ${text}`;
}

function formatCaption(caption) {
  return caption ? formatBotText(caption) : "";
}

function readFileBuffer(file) {
  return fs.readFileSync(file);
}

export function loadCommonFunctions({ socket, webMessage }) {
  const {
    args,
    commandName,
    fullArgs,
    fullMessage,
    isReply,
    prefix,
    remoteJid,
    replyLid,
    userLid,
    replyText,
  } = extractDataFromMessage(webMessage);

  if (!remoteJid) {
    return null;
  }

  const isAudio = baileysIs(webMessage, "audio");
  const isImage = baileysIs(webMessage, "image");
  const isVideo = baileysIs(webMessage, "video");
  const isSticker = baileysIs(webMessage, "sticker");

  const withRetry = async (fn, maxRetries = 3, delayMs = 1000) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(
          `Tentativa ${attempt}/${maxRetries} falhou:`,
          error.message,
        );

        if (attempt < maxRetries) {
          await delay(delayMs * attempt);
        }
      }
    }

    throw new Error(
      `Falha após ${maxRetries} tentativas. Último erro: ${lastError.message}`,
    );
  };

  const sendTypingState = async (anotherJid = "") => {
    const sendToJid = anotherJid || remoteJid;

    await socket.sendPresenceUpdate("composing", sendToJid);

    await delay(TIMEOUT_IN_MILLISECONDS_BY_EVENT);
  };

  const sendRecordState = async (anotherJid = "") => {
    const sendToJid = anotherJid || remoteJid;

    await socket.sendPresenceUpdate("recording", sendToJid);

    await delay(TIMEOUT_IN_MILLISECONDS_BY_EVENT);
  };

  const downloadAudio = async (webMessage, fileName) => {
    return await download(webMessage, fileName, "audio", "mpeg");
  };

  const downloadImage = async (webMessage, fileName) => {
    return await download(webMessage, fileName, "image", "png");
  };

  const downloadSticker = async (webMessage, fileName) => {
    return await download(webMessage, fileName, "sticker", "webp");
  };

  const downloadVideo = async (webMessage, fileName) => {
    return await download(webMessage, fileName, "video", "mp4");
  };

  const sendText = async (text, mentions) => {
    await sendTypingState();

    return await socket.sendMessage(remoteJid, {
      text: formatBotText(text),
      ...buildMentionOptions(mentions),
    });
  };

  const sendEditedText = async (text, messageToEdit, mentions) => {
    return await socket.sendMessage(remoteJid, {
      text: formatBotText(text),
      ...buildMentionOptions(mentions),
      edit: messageToEdit.key,
    });
  };

  const sendReply = async (text, mentions) => {
    await sendTypingState();

    return await socket.sendMessage(
      remoteJid,
      { text: formatBotText(text), ...buildMentionOptions(mentions) },
      buildQuotedOptions(webMessage),
    );
  };

  const sendEditedReply = async (text, messageToEdit, mentions) => {
    return await socket.sendMessage(
      remoteJid,
      {
        text: formatBotText(text),
        ...buildMentionOptions(mentions),
        edit: messageToEdit.key,
      },
      buildQuotedOptions(webMessage),
    );
  };

  const sendContact = async (phoneNumber, displayName) => {
    const phoneNumberHidrated = onlyNumbers(phoneNumber);

    const vcard =
      "BEGIN:VCARD\n" +
      "VERSION:3.0\n" +
      `FN:${displayName}\n` +
      `TEL;type=CELL;type=VOICE;waid=${phoneNumberHidrated}:${phoneNumber}\n` +
      "END:VCARD";

    await socket.sendMessage(remoteJid, {
      contacts: {
        displayName,
        contacts: [{ vcard }],
      },
    });
  };

  const sendLocation = async (latitude, longitude) => {
    await socket.sendMessage(remoteJid, {
      location: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
      },
    });
  };

  const sendReact = async (emoji, msgKey = webMessage.key) => {
    return await socket.sendMessage(remoteJid, {
      react: {
        text: emoji,
        key: msgKey,
      },
    });
  };

  const sendSuccessReact = async () => {
    return await sendReact("✅");
  };

  const sendWaitReact = async () => {
    return await sendReact("⏳");
  };

  const sendWarningReact = async () => {
    return await sendReact("⚠️");
  };

  const sendErrorReact = async () => {
    return await sendReact("❌");
  };

  const sendSuccessReply = async (text, mentions) => {
    await sendSuccessReact();
    return await sendReply(`✅ ${text}`, mentions);
  };

  const sendWaitReply = async (text, mentions) => {
    await sendWaitReact();
    return await sendReply(
      `⏳ Aguarde! ${text || "Carregando dados..."}`,
      mentions,
    );
  };

  const sendWarningReply = async (text, mentions) => {
    await sendWarningReact();
    return await sendReply(`⚠️ Atenção! ${text}`, mentions);
  };

  const sendErrorReply = async (text, mentions) => {
    await sendErrorReact();
    return await sendReply(`❌ Erro! ${text}`, mentions);
  };

  const sendStickerFromFile = async (file, quoted = true) => {
    return await socket.sendMessage(
      remoteJid,
      {
        sticker: readFileBuffer(file),
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendStickerFromURL = async (url, quoted = true) => {
    return await socket.sendMessage(
      remoteJid,
      {
        sticker: { url },
      },
      buildUrlSendOptions(webMessage, url, quoted),
    );
  };

  const sendImageFromFile = async (
    file,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await withRetry(async () => {
      return await socket.sendMessage(
        remoteJid,
        {
          image: readFileBuffer(file),
          caption: formatCaption(caption),
          ...buildMentionOptions(mentions),
        },
        buildQuotedOptions(webMessage, quoted),
      );
    });
  };

  const sendImageFromURL = async (
    url,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await withRetry(async () => {
      return await socket.sendMessage(
        remoteJid,
        {
          image: { url },
          caption: formatCaption(caption),
          ...buildMentionOptions(mentions),
        },
        buildUrlSendOptions(webMessage, url, quoted),
      );
    });
  };

  const sendImageFromBuffer = async (
    buffer,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await withRetry(async () => {
      return await socket.sendMessage(
        remoteJid,
        {
          image: buffer,
          caption: formatCaption(caption),
          ...buildMentionOptions(mentions),
        },
        buildQuotedOptions(webMessage, quoted),
      );
    });
  };

  const sendVideoFromFile = async (
    file,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        video: readFileBuffer(file),
        caption: formatCaption(caption),
        ...buildMentionOptions(mentions),
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendAudioFromFile = async (
    filePath,
    asVoice = false,
    quoted = true,
  ) => {
    const audioBuffer = readFileBuffer(filePath);

    const {
      audioPath,
      audioBuffer: processedBuffer,
      oldAudioPath,
    } = await ajustAudioByBuffer(audioBuffer, asVoice);

    const mimetype = asVoice ? "audio/ogg; codecs=opus" : "audio/mpeg";

    if (asVoice) {
      await sendRecordState();
    }

    removeFileWithTimeout(audioPath);
    removeFileWithTimeout(oldAudioPath);

    return await socket.sendMessage(
      remoteJid,
      {
        audio: processedBuffer,
        mimetype,
        ptt: asVoice,
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendAudioFromBuffer = async (
    buffer,
    asVoice = false,
    quoted = true,
  ) => {
    const {
      audioPath,
      audioBuffer: processedBuffer,
      oldAudioPath,
    } = await ajustAudioByBuffer(buffer, asVoice);

    const mimetype = asVoice ? "audio/ogg; codecs=opus" : "audio/mpeg";

    if (asVoice) {
      await sendRecordState();
    }

    removeFileWithTimeout(audioPath);
    removeFileWithTimeout(oldAudioPath);

    return await socket.sendMessage(
      remoteJid,
      {
        audio: processedBuffer,
        mimetype,
        ptt: asVoice,
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendAudioFromURL = async (url, asVoice = false, quoted = true) => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    const {
      audioPath,
      audioBuffer: processedBuffer,
      oldAudioPath,
    } = await ajustAudioByBuffer(audioBuffer, asVoice);

    const mimetype = asVoice ? "audio/ogg; codecs=opus" : "audio/mpeg";

    removeFileWithTimeout(audioPath);
    removeFileWithTimeout(oldAudioPath);

    if (asVoice) {
      await sendRecordState();
    }

    return await socket.sendMessage(
      remoteJid,
      {
        audio: processedBuffer,
        mimetype,
        ptt: asVoice,
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendVideoFromURL = async (
    url,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        video: { url },
        caption: formatCaption(caption),
        ...buildMentionOptions(mentions),
      },
      buildUrlSendOptions(webMessage, url, quoted),
    );
  };

  const sendGifFromFile = async (
    file,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        video: readFileBuffer(file),
        caption: formatCaption(caption),
        gifPlayback: true,
        ...buildMentionOptions(mentions),
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendGifFromURL = async (
    url,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        video: { url },
        caption: formatCaption(caption),
        gifPlayback: true,
        ...buildMentionOptions(mentions),
      },
      buildUrlSendOptions(webMessage, url, quoted),
    );
  };

  const sendGifFromBuffer = async (
    buffer,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        video: buffer,
        caption: formatCaption(caption),
        gifPlayback: true,
        ...buildMentionOptions(mentions),
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendDocumentFromFile = async (
    file,
    mimetype,
    fileName,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        document: readFileBuffer(file),
        mimetype: mimetype || "application/octet-stream",
        fileName: fileName || "documento.pdf",
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendDocumentFromURL = async (
    url,
    mimetype,
    fileName,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        document: { url },
        mimetype: mimetype || "application/octet-stream",
        fileName: fileName || "documento.pdf",
      },
      buildUrlSendOptions(webMessage, url, quoted),
    );
  };

  const sendDocumentFromBuffer = async (
    buffer,
    mimetype,
    fileName,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        document: buffer,
        mimetype: mimetype || "application/octet-stream",
        fileName: fileName || "documento.pdf",
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendVideoFromBuffer = async (
    buffer,
    caption = "",
    mentions = null,
    quoted = true,
  ) => {
    return await socket.sendMessage(
      remoteJid,
      {
        video: buffer,
        caption: formatCaption(caption),
        ...buildMentionOptions(mentions),
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendStickerFromBuffer = async (buffer, quoted = true) => {
    return await socket.sendMessage(
      remoteJid,
      {
        sticker: buffer,
      },
      buildQuotedOptions(webMessage, quoted),
    );
  };

  const sendPoll = async (title, options, singleChoice = false) => {
    return await socket.sendMessage(remoteJid, {
      poll: {
        name: `${BOT_EMOJI} ${title}`,
        selectableCount: singleChoice ? 1 : 0,
        toAnnouncementGroup: true,
        values: options.map((option) => option.optionName),
      },
    });
  };

  const isGroup = !!remoteJid?.endsWith("@g.us");
  const isGroupWithLid = !!userLid?.endsWith("@lid");

  const deleteMessage = async (key) => {
    const { id, remoteJid, participant } = key;

    const deleteKey = {
      remoteJid,
      fromMe: false,
      id,
      participant,
    };

    await socket.sendMessage(remoteJid, { delete: deleteKey });
  };

  const getGroupMetadata = async (groupJid = remoteJid) => {
    if (!groupJid.endsWith("@g.us")) {
      return null;
    }

    return await socket.groupMetadata(groupJid);
  };

  const getGroupName = async (groupJid = remoteJid) => {
    if (!groupJid.endsWith("@g.us")) {
      return null;
    }

    const metadata = await getGroupMetadata(groupJid);
    return metadata?.subject || "";
  };

  const getGroupOwner = async (groupJid = remoteJid) => {
    if (!groupJid.endsWith("@g.us")) {
      return null;
    }

    const metadata = await getGroupMetadata(groupJid);
    return metadata?.owner || "";
  };

  const getGroupParticipants = async (groupJid = remoteJid) => {
    if (!groupJid.endsWith("@g.us")) {
      return [];
    }

    const metadata = await getGroupMetadata(groupJid);
    return metadata?.participants || [];
  };

  const getGroupAdmins = async (groupJid = remoteJid) => {
    if (!groupJid.endsWith("@g.us")) {
      return [];
    }

    const participants = await getGroupParticipants(groupJid);
    return participants
      .filter((p) => p.admin === "admin" || p.admin === "superadmin")
      .map((p) => p.id);
  };

  return {
    args,
    commandName,
    fullArgs,
    fullMessage,
    isGroup,
    isGroupWithLid,
    isAudio,
    isImage,
    isReply,
    isSticker,
    isVideo,
    prefix,
    remoteJid,
    replyLid,
    socket,
    userLid,
    replyText,
    webMessage,
    deleteMessage,
    downloadAudio,
    downloadImage,
    downloadSticker,
    downloadVideo,
    getGroupAdmins,
    getGroupMetadata,
    getGroupName,
    getGroupOwner,
    getGroupParticipants,
    sendAudioFromBuffer,
    sendAudioFromFile,
    sendAudioFromURL,
    sendContact,
    sendDocumentFromBuffer,
    sendDocumentFromFile,
    sendDocumentFromURL,
    sendEditedReply,
    sendEditedText,
    sendErrorReact,
    sendErrorReply,
    sendGifFromBuffer,
    sendGifFromFile,
    sendGifFromURL,
    sendImageFromBuffer,
    sendImageFromFile,
    sendImageFromURL,
    sendLocation,
    sendPoll,
    sendReact,
    sendReply,
    sendStickerFromBuffer,
    sendStickerFromFile,
    sendStickerFromURL,
    sendSuccessReact,
    sendSuccessReply,
    sendText,
    sendVideoFromBuffer,
    sendVideoFromFile,
    sendVideoFromURL,
    sendWaitReact,
    sendWaitReply,
    sendWarningReact,
    sendWarningReply,
  };
}
