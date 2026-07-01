import { BOT_LID, OWNER_LID } from "../config.js";
import { DangerError } from "../errors/index.js";
import { onlyNumbers } from "./index.js";

const DURATION_FACTORS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
};

const DURATION_PATTERN = /^(\d+)([smh])$/i;

export function parseDurationToMs(rawDuration) {
  const durationText = String(rawDuration || "").trim().toLowerCase();
  const match = durationText.match(DURATION_PATTERN);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const factor = DURATION_FACTORS[unit];

  if (!Number.isInteger(amount) || amount <= 0 || !factor) {
    return null;
  }

  return amount * factor;
}

export function assertGroupCommand(isGroup) {
  if (!isGroup) {
    throw new DangerError("Este comando só pode ser usado em grupos.");
  }
}

export function resolveMemberTargetLid({ args = [], replyLid = null }) {
  if (replyLid) {
    return replyLid;
  }

  const targetNumber = onlyNumbers(args[0] || "");

  if (!targetNumber) {
    return null;
  }

  return `${targetNumber}@lid`;
}

export function getMemberTargetNumber(targetLid) {
  return onlyNumbers(targetLid || "");
}

export function assertMemberTarget(targetLid, usageMessage) {
  if (!targetLid || !getMemberTargetNumber(targetLid)) {
    throw new DangerError(usageMessage);
  }
}

export function assertMutableTarget(targetLid) {
  if (OWNER_LID && targetLid === OWNER_LID) {
    throw new DangerError("Você não pode mutar o dono do bot!");
  }

  if (BOT_LID && targetLid === BOT_LID) {
    throw new DangerError("Você não pode mutar o bot.");
  }
}

export function findGroupParticipant(groupMetadata, targetLid) {
  return groupMetadata?.participants?.find(
    (participant) => participant.id === targetLid,
  );
}

export function isAdminParticipant(participant, groupOwner) {
  return Boolean(
    participant?.admin ||
      participant?.admin === "admin" ||
      participant?.admin === "superadmin" ||
      participant?.id === groupOwner,
  );
}

export function assertTargetCanBeMuted({ groupMetadata, targetLid }) {
  const participant = findGroupParticipant(groupMetadata, targetLid);

  if (!participant) {
    return { ok: false, reason: "not_in_group" };
  }

  if (isAdminParticipant(participant, groupMetadata?.owner)) {
    throw new DangerError("Você não pode mutar um administrador.");
  }

  return { ok: true, participant };
}
