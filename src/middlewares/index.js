import { delay } from "baileys";
import { OWNER_LID } from "../config.js";
import { getPrefix } from "../utils/database.js";
import { messageHandler } from "./messageHandler.js";
import { onGroupParticipantsUpdate } from "./onGroupParticipantsUpdate.js";
import { onMessagesUpsert } from "./onMesssagesUpsert.js";

export { messageHandler, onGroupParticipantsUpdate, onMessagesUpsert };

const IP_ADDRESS_PATTERN =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const URL_PATTERN =
  /(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/[^\s]*)?/g;

const FILE_EXTENSION_PATTERN =
  /\.(txt|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|jpg|jpeg|png|gif|mp4|mp3|avi)$/i;

export function verifyPrefix(prefix, groupJid) {
  return getPrefix(groupJid) === prefix;
}

export function hasTypeAndCommand({ type, command }) {
  return Boolean(type && command);
}

function isOnlyNumbers(text) {
  return /^\d+$/.test(text);
}

function hasInvalidDotSequence(text) {
  return /[.]{2,3}/.test(text);
}

function normalizeUrlMatch(match) {
  return match.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

function hasValidBoundaries(text, match) {
  const matchIndex = text.indexOf(match);
  const beforeMatch = text.substring(0, matchIndex);
  const afterMatch = text.substring(matchIndex + match.length);
  const charBefore = beforeMatch.slice(-1);
  const charAfter = afterMatch.slice(0, 1);

  if (
    charBefore &&
    /[a-zA-Z0-9]/.test(charBefore) &&
    !/[\s.,:;!?()[\]{}]/.test(charBefore)
  ) {
    return false;
  }

  if (
    charAfter &&
    /[a-zA-Z0-9]/.test(charAfter) &&
    !/[\s.,:;!?()[\]{}/]/.test(charAfter)
  ) {
    return false;
  }

  return true;
}

function isValidDomainCandidate(cleanMatch) {
  if (/\s/.test(cleanMatch) || FILE_EXTENSION_PATTERN.test(cleanMatch)) {
    return false;
  }

  const domainPart = cleanMatch.split("/")[0];
  const domainParts = domainPart.split(".");

  if (domainParts.length < 2) {
    return false;
  }

  const extension = domainParts[domainParts.length - 1];

  if (extension.length < 2) {
    return false;
  }

  try {
    const url = new URL(`https://${cleanMatch}`);
    return url.hostname.includes(".") && url.hostname.length > 4;
  } catch {
    return false;
  }
}

export function isLink(text) {
  const cleanText = String(text || "").trim();

  if (isOnlyNumbers(cleanText) || hasInvalidDotSequence(cleanText)) {
    return false;
  }

  if (IP_ADDRESS_PATTERN.test(cleanText.split("/")[0])) {
    return true;
  }

  const matches = cleanText.match(URL_PATTERN);

  if (!matches?.length) {
    return false;
  }

  return matches.some((match) => {
    const cleanMatch = normalizeUrlMatch(match);

    return (
      hasValidBoundaries(cleanText, match) && isValidDomainCandidate(cleanMatch)
    );
  });
}

function findParticipant(participants, userLid) {
  return participants.find((participant) => participant.id === userLid);
}

function isGroupOwnerOrAdmin({ participant, owner, userLid }) {
  return (
    userLid === owner ||
    participant?.admin === "superadmin" ||
    participant?.admin === "admin"
  );
}

export async function isAdmin({ remoteJid, userLid, socket }) {
  const { participants, owner } = await socket.groupMetadata(remoteJid);
  const participant = findParticipant(participants, userLid);

  if (!participant) {
    return userLid === OWNER_LID;
  }

  return isGroupOwnerOrAdmin({ participant, owner, userLid });
}

export function isBotOwner({ userLid }) {
  return userLid === OWNER_LID;
}

function canUseAdminCommand({ participant, owner, userLid }) {
  const botOwner = isBotOwner({ userLid });
  return botOwner || isGroupOwnerOrAdmin({ participant, owner, userLid });
}

function canUseOwnerCommand({ participants, participant, owner, userLid }) {
  if (isBotOwner({ userLid })) {
    return true;
  }

  if (userLid === owner || participant?.admin === "superadmin") {
    return true;
  }

  const ownerStillInGroup = participants.some(
    (groupParticipant) => groupParticipant.id === owner,
  );

  const hasSuperAdmin = participants.some(
    (groupParticipant) => groupParticipant.admin === "superadmin",
  );

  if (!ownerStillInGroup || !hasSuperAdmin) {
    return participant?.admin === "admin";
  }

  return false;
}

export async function checkPermission({ type, socket, userLid, remoteJid }) {
  if (type === "member") {
    return true;
  }

  try {
    await delay(500);

    const { participants, owner } = await socket.groupMetadata(remoteJid);
    const participant = findParticipant(participants, userLid);

    if (!participant) {
      return false;
    }

    if (type === "admin") {
      return canUseAdminCommand({ participant, owner, userLid });
    }

    if (type === "owner") {
      return canUseOwnerCommand({ participants, participant, owner, userLid });
    }

    return false;
  } catch {
    return false;
  }
}
