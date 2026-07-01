import { sendCleanChat } from "./cleanChat.js";
import { errorLog } from "./logger.js";

const RECENT_PARTICIPANT_TTL_MS = 60 * 1000;
const RECENT_PRUNE_INTERVAL_MS = 30 * 1000;
const DEFAULT_GROUP_INCIDENT_TTL_MS = 8 * 1000;

let groupIncidentTtlMs = DEFAULT_GROUP_INCIDENT_TTL_MS;
let lastPruneAt = 0;

const recentlyHandled = new Map();
const inFlight = new Map();
const groupIncidents = new Map();

function participantKey(remoteJid, userLid) {
  return `${remoteJid}:${userLid}`;
}

async function runStep(step, errorMessage) {
  try {
    await step();
  } catch (error) {
    errorLog(`${errorMessage} Detalhes: ${error.message}`);
  }
}

function pruneRecentlyHandled() {
  const now = Date.now();

  if (now - lastPruneAt < RECENT_PRUNE_INTERVAL_MS) {
    return;
  }

  lastPruneAt = now;

  for (const [key, expiresAt] of recentlyHandled) {
    if (expiresAt <= now) {
      recentlyHandled.delete(key);
    }
  }
}

function rememberHandledParticipant(remoteJid, userLid) {
  recentlyHandled.set(
    participantKey(remoteJid, userLid),
    Date.now() + RECENT_PARTICIPANT_TTL_MS,
  );
}

function wasRecentlyHandled(remoteJid, userLid) {
  const expiresAt = recentlyHandled.get(participantKey(remoteJid, userLid));
  return Boolean(expiresAt && expiresAt > Date.now());
}

function createGroupIncident(socket, remoteJid) {
  const incident = { groupClosed: false, reopenTimer: undefined };

  incident.closePromise = (async () => {
    await runStep(
      () => socket.groupSettingUpdate(remoteJid, "announcement"),
      "Erro ao fechar o grupo pelo anti-payment.",
    );

    incident.groupClosed = true;

    await sendCleanChat({ socket, remoteJid });
  })();

  return incident;
}

function ensureGroupIncident(socket, remoteJid) {
  const existing = groupIncidents.get(remoteJid);

  if (existing) {
    return existing;
  }

  const incident = createGroupIncident(socket, remoteJid);
  groupIncidents.set(remoteJid, incident);

  return incident;
}

function clearGroupIncident(remoteJid, incident) {
  if (groupIncidents.get(remoteJid) === incident) {
    groupIncidents.delete(remoteJid);
  }
}

function scheduleGroupReopen(socket, remoteJid) {
  const incident = groupIncidents.get(remoteJid);

  if (!incident) {
    return;
  }

  if (!incident.groupClosed) {
    groupIncidents.delete(remoteJid);
    return;
  }

  if (incident.reopenTimer) {
    clearTimeout(incident.reopenTimer);
  }

  incident.reopenTimer = setTimeout(() => {
    runStep(
      () => socket.groupSettingUpdate(remoteJid, "not_announcement"),
      "Erro ao abrir o grupo pelo anti-payment.",
    ).finally(() => clearGroupIncident(remoteJid, incident));
  }, groupIncidentTtlMs);

  incident.reopenTimer.unref?.();
}

async function removePaymentAuthor({ socket, remoteJid, userLid }) {
  let removed = false;

  await socket
    .groupParticipantsUpdate(remoteJid, [userLid], "remove")
    .then(() => {
      removed = true;
    })
    .catch((error) => {
      errorLog(
        `Erro ao banir membro pelo anti-payment. Detalhes: ${error.message}`,
      );
    });

  return removed;
}

function deletePaymentMessage({ socket, remoteJid, messageKey }) {
  if (!messageKey) {
    return Promise.resolve();
  }

  return runStep(
    () => socket.sendMessage(remoteJid, { delete: messageKey }),
    "Erro ao apagar a mensagem de pagamento.",
  );
}

async function runDefense({ socket, remoteJid, userLid, messageKey }) {
  const incident = ensureGroupIncident(socket, remoteJid);

  const [, removed] = await Promise.all([
    incident.closePromise,
    removePaymentAuthor({ socket, remoteJid, userLid }),
    deletePaymentMessage({ socket, remoteJid, messageKey }),
  ]);

  scheduleGroupReopen(socket, remoteJid);

  if (removed) {
    rememberHandledParticipant(remoteJid, userLid);
  }

  return removed;
}

export function defendAgainstPayment({ socket, remoteJid, userLid, messageKey }) {
  if (!remoteJid || !userLid) {
    return Promise.resolve(false);
  }

  pruneRecentlyHandled();

  if (wasRecentlyHandled(remoteJid, userLid)) {
    return Promise.resolve(true);
  }

  const key = participantKey(remoteJid, userLid);
  const existing = inFlight.get(key);

  if (existing) {
    return existing;
  }

  const defense = Promise.resolve().then(() =>
    runDefense({ socket, remoteJid, userLid, messageKey }),
  );

  inFlight.set(key, defense);

  return defense.finally(() => {
    if (inFlight.get(key) === defense) {
      inFlight.delete(key);
    }
  });
}

export function __clearPaymentDefenseState() {
  for (const incident of groupIncidents.values()) {
    if (incident.reopenTimer) {
      clearTimeout(incident.reopenTimer);
    }
  }

  recentlyHandled.clear();
  inFlight.clear();
  groupIncidents.clear();
  lastPruneAt = 0;
  groupIncidentTtlMs = DEFAULT_GROUP_INCIDENT_TTL_MS;
}

export function __setGroupIncidentTtlForTests(ms) {
  groupIncidentTtlMs = ms;
}
