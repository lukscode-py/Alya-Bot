import fs from "node:fs";
import { exitMessage, welcomeMessage } from "../messages.js";
import { getProfileImageData } from "../services/baileys.js";
import {
  isActiveExitGroup,
  isActiveGroup,
  isActiveWelcomeGroup,
} from "../utils/database.js";
import { extractUserLid, onlyNumbers } from "../utils/index.js";
import { errorLog } from "../utils/logger.js";

function isGroupJid(remoteJid) {
  return remoteJid?.endsWith("@g.us");
}

function buildMemberMessage(template, userLid) {
  const mentions = [];
  let text = template;

  if (template.includes("@member")) {
    text = template.replace("@member", `@${onlyNumbers(userLid)}`);
    mentions.push(userLid);
  }

  return { text, mentions };
}

function removeProfileImageIfTemporary(profileImage) {
  if (!profileImage || profileImage.includes("default-user")) {
    return;
  }

  if (fs.existsSync(profileImage)) {
    fs.unlinkSync(profileImage);
  }
}

async function sendMemberEventMessage({ socket, remoteJid, userLid, template }) {
  const { text, mentions } = buildMemberMessage(template, userLid);
  const { buffer, profileImage } = await getProfileImageData(socket, userLid);

  try {
    if (!buffer) {
      await socket.sendMessage(remoteJid, { text, mentions });
      return;
    }

    try {
      await socket.sendMessage(remoteJid, {
        image: buffer,
        caption: text,
        mentions,
      });
    } catch {
      await socket.sendMessage(remoteJid, { text, mentions });
    }
  } finally {
    removeProfileImageIfTemporary(profileImage);
  }
}

function resolveParticipantTemplate({ remoteJid, action }) {
  if (action === "add" && isActiveWelcomeGroup(remoteJid)) {
    return welcomeMessage;
  }

  if (action === "remove" && isActiveExitGroup(remoteJid)) {
    return exitMessage;
  }

  return null;
}

export async function onGroupParticipantsUpdate({
  data,
  remoteJid,
  socket,
  action,
}) {
  try {
    if (!isGroupJid(remoteJid) || !isActiveGroup(remoteJid)) {
      return;
    }

    const template = resolveParticipantTemplate({ remoteJid, action });

    if (!template) {
      return;
    }

    await sendMemberEventMessage({
      socket,
      remoteJid,
      userLid: extractUserLid(data),
      template,
    });
  } catch (error) {
    errorLog(`Erro em onGroupParticipantsUpdate: ${error.message}`);
    errorLog(JSON.stringify(error, null, 2));
  }
}
