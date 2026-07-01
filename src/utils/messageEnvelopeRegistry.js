const ENVELOPE_TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES_PER_GROUP = 1000;

const registry = new Map();

const NON_CONTENT_KEYS = new Set([
  "messageContextInfo",
  "senderKeyDistributionMessage",
]);

function isGroupJid(jid) {
  return jid?.endsWith("@g.us");
}

function hasReadableContent(message) {
  if (!message || typeof message !== "object") {
    return false;
  }

  return Object.keys(message).some((key) => !NON_CONTENT_KEYS.has(key));
}

function resolveMessageParticipant(webMessage) {
  const participantAlt = webMessage?.key?.participantAlt;
  const participant = webMessage?.key?.participant || participantAlt;

  return { participant, participantAlt };
}

function resolveContentState(webMessage, isPayment) {
  if (isPayment) {
    return "payment";
  }

  return hasReadableContent(webMessage?.message) ? "other" : "unreadable";
}

function getOrCreateGroupRegistry(groupJid) {
  let groupMap = registry.get(groupJid);

  if (!groupMap) {
    groupMap = new Map();
    registry.set(groupJid, groupMap);
  }

  return groupMap;
}

function pruneExpiredEntries(groupMap, now = Date.now()) {
  for (const [id, entry] of groupMap) {
    if (now - entry.ts > ENVELOPE_TTL_MS) {
      groupMap.delete(id);
    }
  }
}

function pruneOverflowEntries(groupMap) {
  while (groupMap.size > MAX_ENTRIES_PER_GROUP) {
    const oldestKey = groupMap.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    groupMap.delete(oldestKey);
  }
}

function pruneGroup(groupMap) {
  pruneExpiredEntries(groupMap);
  pruneOverflowEntries(groupMap);
}

export function recordMessageEnvelope(webMessage, isPayment) {
  const remoteJid = webMessage?.key?.remoteJid;
  const id = webMessage?.key?.id;
  const { participant, participantAlt } = resolveMessageParticipant(webMessage);

  if (!isGroupJid(remoteJid) || !id || !participant) {
    return;
  }

  const groupMap = getOrCreateGroupRegistry(remoteJid);

  groupMap.set(id, {
    participant,
    participantAlt,
    contentState: resolveContentState(webMessage, isPayment),
    stealth: Boolean(webMessage?.stealthMeta),
    ts: Date.now(),
  });

  pruneGroup(groupMap);
}

export function verifyQuotedAuthor({ groupJid, stanzaId, participant }) {
  if (!stanzaId) {
    return { corroborated: false, contradicted: false };
  }

  const entry = registry.get(groupJid)?.get(stanzaId);

  if (!entry) {
    return { corroborated: false, contradicted: false };
  }

  if (entry.participant !== participant && entry.participantAlt !== participant) {
    return { corroborated: false, contradicted: true };
  }

  if (entry.contentState === "other") {
    return { corroborated: false, contradicted: true };
  }

  return { corroborated: true, contradicted: false };
}

export function __clearEnvelopeRegistry() {
  registry.clear();
}
