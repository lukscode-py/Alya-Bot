import { EXTERNAL_API_BASE_URL } from "../config.js";

export const ALYA_EXTERNAL_API_LABEL = "API externa da Alya";

function normalizeUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}

function normalizeDetail(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getResponseFallback(response) {
  const status = response?.status;
  const statusText = normalizeDetail(response?.statusText);

  if (status && statusText) {
    return `HTTP ${status} - ${statusText}`;
  }

  if (status) {
    return `HTTP ${status}`;
  }

  return "Erro desconhecido";
}

function resolvePayloadMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return (
    normalizeDetail(payload.message) ||
    normalizeDetail(payload.error) ||
    normalizeDetail(payload.details)
  );
}

export function isConfiguredExternalApiUrl(url) {
  const baseUrl = normalizeUrl(EXTERNAL_API_BASE_URL);
  const targetUrl = normalizeUrl(url);

  return Boolean(baseUrl && targetUrl.startsWith(baseUrl));
}

export function getRemoteServiceLabelFromUrl(url) {
  if (!url || url === "URL não disponível") {
    return ALYA_EXTERNAL_API_LABEL;
  }

  if (isConfiguredExternalApiUrl(url)) {
    return ALYA_EXTERNAL_API_LABEL;
  }

  return url;
}

export function formatRemoteCallErrorMessage({
  commandName,
  details,
  serviceName = ALYA_EXTERNAL_API_LABEL,
}) {
  return `Ocorreu um erro ao executar uma chamada remota para ${serviceName} no comando ${commandName}!

📄 *Detalhes*: ${normalizeDetail(details) || "Erro desconhecido"}`;
}

export async function readRemoteErrorDetails(response) {
  try {
    const payload = await response.json();
    return resolvePayloadMessage(payload) || getResponseFallback(response);
  } catch {
    return getResponseFallback(response);
  }
}

export async function fetchRemoteCommandResource({
  url,
  commandName,
  sendErrorReply,
}) {
  const response = await fetch(url);

  if (response.ok) {
    return response;
  }

  const details = await readRemoteErrorDetails(response);

  await sendErrorReply(
    formatRemoteCallErrorMessage({
      commandName,
      details,
    }),
  );

  return null;
}

function formatDate(dateText) {
  if (typeof dateText !== "string" || !dateText.trim()) {
    return "Não informado";
  }

  const [year, month, day] = dateText.split("-");

  if (!year || !month || !day) {
    return dateText;
  }

  return `${day}/${month}/${year}`;
}

export function formatExternalApiBalance(data) {
  const plan = data?.plan || "Não informado";
  const requestsLeft = data?.requests_left ?? data?.requestsLeft ?? "Não informado";
  const endDate = formatDate(data?.end_date ?? data?.endDate);

  return `🤖 *Saldo da API externa*

📦 *Plano:* ${plan}
🔢 *Requests restantes:* ${requestsLeft}
📅 *Validade do plano:* ${endDate}`;
}
