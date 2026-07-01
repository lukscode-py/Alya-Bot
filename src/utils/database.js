import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREFIX, EXTERNAL_API_TOKEN } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databasePath = path.resolve(__dirname, "..", "..", "database");

const AFK_GROUPS_FILE = "afk-groups";
const ANTI_LINK_GROUPS_FILE = "anti-link-groups";
const AUTO_RESPONDER_FILE = "auto-responder";
const AUTO_RESPONDER_GROUPS_FILE = "auto-responder-groups";
const AUTO_STICKER_GROUPS_FILE = "auto-sticker-groups";
const CONFIG_FILE = "config";
const EXIT_GROUPS_FILE = "exit-groups";
const GROUP_RESTRICTIONS_FILE = "group-restrictions";
const INACTIVE_GROUPS_FILE = "inactive-groups";
const MUTE_FILE = "muted";
const ONLY_ADMINS_FILE = "only-admins";
const PREFIX_GROUPS_FILE = "prefix-groups";
const RESTRICTED_MESSAGES_FILE = "restricted-messages";
const WELCOME_GROUPS_FILE = "welcome-groups";

function resolveDatabaseFile(jsonFile) {
  return path.resolve(databasePath, `${jsonFile}.json`);
}

function ensureDatabaseDirectory() {
  if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(databasePath, { recursive: true });
  }
}

function createIfNotExists(fullPath, formatIfNotExists = []) {
  ensureDatabaseDirectory();

  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, JSON.stringify(formatIfNotExists), "utf8");
  }
}

function readJSON(jsonFile, formatIfNotExists = []) {
  const fullPath = resolveDatabaseFile(jsonFile);

  createIfNotExists(fullPath, formatIfNotExists);

  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function writeJSON(jsonFile, data, formatIfNotExists = []) {
  const fullPath = resolveDatabaseFile(jsonFile);

  createIfNotExists(fullPath, formatIfNotExists);

  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf8");
}

function readList(jsonFile) {
  const data = readJSON(jsonFile, []);

  return Array.isArray(data) ? data : [];
}

function writeList(jsonFile, data) {
  writeJSON(jsonFile, data, []);
}

function readObject(jsonFile) {
  const data = readJSON(jsonFile, {});

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  return data;
}

function writeObject(jsonFile, data) {
  writeJSON(jsonFile, data, {});
}

function activateListItem(jsonFile, item) {
  const items = readList(jsonFile);

  if (!items.includes(item)) {
    items.push(item);
  }

  writeList(jsonFile, items);
}

function deactivateListItem(jsonFile, item) {
  const items = readList(jsonFile);
  const index = items.indexOf(item);

  if (index === -1) {
    return;
  }

  items.splice(index, 1);
  writeList(jsonFile, items);
}

function isActiveListItem(jsonFile, item) {
  return readList(jsonFile).includes(item);
}

function normalizeMatch(match) {
  return match.toLocaleUpperCase();
}

function findAutoResponderItem(responses, match) {
  const matchUpperCase = normalizeMatch(match);

  return responses.find(
    (response) => normalizeMatch(response.match) === matchUpperCase,
  );
}

export function setAfkMember(groupId, memberId, reason) {
  const afkGroups = readObject(AFK_GROUPS_FILE);

  if (!afkGroups[groupId]) {
    afkGroups[groupId] = {};
  }

  afkGroups[groupId][memberId] = reason.trim();

  writeObject(AFK_GROUPS_FILE, afkGroups);
}

export function getAfkReason(groupId, memberId) {
  const afkGroups = readObject(AFK_GROUPS_FILE);

  return afkGroups[groupId]?.[memberId] || null;
}

export function listAfkMembers(groupId) {
  const afkGroups = readObject(AFK_GROUPS_FILE);

  return { ...(afkGroups[groupId] || {}) };
}

export function removeAfkMember(groupId, memberId) {
  const afkGroups = readObject(AFK_GROUPS_FILE);

  if (!afkGroups[groupId]?.[memberId]) {
    return false;
  }

  delete afkGroups[groupId][memberId];

  if (!Object.keys(afkGroups[groupId]).length) {
    delete afkGroups[groupId];
  }

  writeObject(AFK_GROUPS_FILE, afkGroups);

  return true;
}

export function activateExitGroup(groupId) {
  activateListItem(EXIT_GROUPS_FILE, groupId);
}

export function deactivateExitGroup(groupId) {
  deactivateListItem(EXIT_GROUPS_FILE, groupId);
}

export function isActiveExitGroup(groupId) {
  return isActiveListItem(EXIT_GROUPS_FILE, groupId);
}

export function activateWelcomeGroup(groupId) {
  activateListItem(WELCOME_GROUPS_FILE, groupId);
}

export function deactivateWelcomeGroup(groupId) {
  deactivateListItem(WELCOME_GROUPS_FILE, groupId);
}

export function isActiveWelcomeGroup(groupId) {
  return isActiveListItem(WELCOME_GROUPS_FILE, groupId);
}

export function activateGroup(groupId) {
  deactivateListItem(INACTIVE_GROUPS_FILE, groupId);
}

export function deactivateGroup(groupId) {
  activateListItem(INACTIVE_GROUPS_FILE, groupId);
}

export function isActiveGroup(groupId) {
  return !isActiveListItem(INACTIVE_GROUPS_FILE, groupId);
}

export function getAutoResponderResponse(match) {
  const responses = readList(AUTO_RESPONDER_FILE);
  const data = findAutoResponderItem(responses, match);

  return data?.answer || null;
}

export function activateAutoResponderGroup(groupId) {
  activateListItem(AUTO_RESPONDER_GROUPS_FILE, groupId);
}

export function deactivateAutoResponderGroup(groupId) {
  deactivateListItem(AUTO_RESPONDER_GROUPS_FILE, groupId);
}

export function isActiveAutoResponderGroup(groupId) {
  return isActiveListItem(AUTO_RESPONDER_GROUPS_FILE, groupId);
}

export function activateAntiLinkGroup(groupId) {
  activateListItem(ANTI_LINK_GROUPS_FILE, groupId);
}

export function deactivateAntiLinkGroup(groupId) {
  deactivateListItem(ANTI_LINK_GROUPS_FILE, groupId);
}

export function isActiveAntiLinkGroup(groupId) {
  return isActiveListItem(ANTI_LINK_GROUPS_FILE, groupId);
}

export function activateAutoStickerGroup(groupId) {
  activateListItem(AUTO_STICKER_GROUPS_FILE, groupId);
}

export function deactivateAutoStickerGroup(groupId) {
  deactivateListItem(AUTO_STICKER_GROUPS_FILE, groupId);
}

export function isActiveAutoStickerGroup(groupId) {
  return isActiveListItem(AUTO_STICKER_GROUPS_FILE, groupId);
}

export function muteMember(groupId, memberId) {
  const mutedMembers = readObject(MUTE_FILE);

  if (!mutedMembers[groupId]) {
    mutedMembers[groupId] = [];
  }

  if (!mutedMembers[groupId].includes(memberId)) {
    mutedMembers[groupId].push(memberId);
  }

  writeObject(MUTE_FILE, mutedMembers);
}

export function unmuteMember(groupId, memberId) {
  const mutedMembers = readObject(MUTE_FILE);

  if (!mutedMembers[groupId]) {
    return;
  }

  const index = mutedMembers[groupId].indexOf(memberId);

  if (index !== -1) {
    mutedMembers[groupId].splice(index, 1);
  }

  writeObject(MUTE_FILE, mutedMembers);
}

export function checkIfMemberIsMuted(groupId, memberId) {
  const mutedMembers = readObject(MUTE_FILE);

  return Boolean(mutedMembers[groupId]?.includes(memberId));
}

export function activateOnlyAdmins(groupId) {
  activateListItem(ONLY_ADMINS_FILE, groupId);
}

export function deactivateOnlyAdmins(groupId) {
  deactivateListItem(ONLY_ADMINS_FILE, groupId);
}

export function isActiveOnlyAdmins(groupId) {
  return isActiveListItem(ONLY_ADMINS_FILE, groupId);
}

export function readGroupRestrictions() {
  return readObject(GROUP_RESTRICTIONS_FILE);
}

export function saveGroupRestrictions(restrictions) {
  writeObject(GROUP_RESTRICTIONS_FILE, restrictions);
}

export function isActiveGroupRestriction(groupId, restriction) {
  const restrictions = readGroupRestrictions();

  if (!restrictions[groupId]) {
    return false;
  }

  return restrictions[groupId][restriction] === true;
}

export function updateIsActiveGroupRestriction(groupId, restriction, isActive) {
  const restrictions = readGroupRestrictions();

  if (!restrictions[groupId]) {
    restrictions[groupId] = {};
  }

  restrictions[groupId][restriction] = isActive;

  saveGroupRestrictions(restrictions);
}

export function readRestrictedMessageTypes() {
  return readJSON(RESTRICTED_MESSAGES_FILE, {
    sticker: "stickerMessage",
    video: "videoMessage",
    image: "imageMessage",
    audio: "audioMessage",
    product: "productMessage",
    document: "documentMessage",
    event: "eventMessage",
  });
}

export function setPrefix(groupJid, prefix) {
  const prefixGroups = readObject(PREFIX_GROUPS_FILE);

  prefixGroups[groupJid] = prefix;

  writeObject(PREFIX_GROUPS_FILE, prefixGroups);
}

export function getPrefix(groupJid) {
  const prefixGroups = readObject(PREFIX_GROUPS_FILE);

  return prefixGroups[groupJid] || PREFIX;
}

export function listAutoResponderItems() {
  const responses = readList(AUTO_RESPONDER_FILE);

  return responses.map((item, index) => ({
    key: index + 1,
    match: item.match,
    answer: item.answer,
  }));
}

export function addAutoResponderItem(match, answer) {
  const responses = readList(AUTO_RESPONDER_FILE);

  if (findAutoResponderItem(responses, match)) {
    return false;
  }

  responses.push({
    match: match.trim(),
    answer: answer.trim(),
  });

  writeList(AUTO_RESPONDER_FILE, responses);

  return true;
}

export function removeAutoResponderItemByKey(key) {
  const responses = readList(AUTO_RESPONDER_FILE);
  const index = key - 1;

  if (index < 0 || index >= responses.length) {
    return false;
  }

  responses.splice(index, 1);
  writeList(AUTO_RESPONDER_FILE, responses);

  return true;
}

export function setExternalApiToken(token) {
  const config = readObject(CONFIG_FILE);

  config.external_api_token = token;

  writeObject(CONFIG_FILE, config);
}

export function getExternalApiToken() {
  const config = readObject(CONFIG_FILE);

  return config.external_api_token || EXTERNAL_API_TOKEN;
}
