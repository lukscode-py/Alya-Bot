import crypto from "node:crypto";
import { AI_ERROR_CODES } from "./errors.js";

export function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(String(apiKey)).digest("hex").slice(0, 16);
}

export function resolveApiKeys(apiKeys = []) {
  const resolved = [];

  for (const entry of apiKeys) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("env:")) {
      const envName = trimmed.slice(4).trim();
      const envValue = process.env[envName];

      if (!envValue) {
        continue;
      }

      for (const value of envValue.split(",")) {
        const key = value.trim();

        if (key) {
          resolved.push(key);
        }
      }

      continue;
    }

    resolved.push(trimmed);
  }

  return [...new Set(resolved)];
}

export function classifyProviderError(error) {
  const status = error?.response?.status || error?.status;
  const code = error?.code;

  if (status === 401 || status === 403) {
    return {
      error: AI_ERROR_CODES.AI_API_KEY_INVALID,
      keyStatus: "invalid",
      retryable: false,
      cooldownMs: null,
      status,
      message: "API key inválida ou sem permissão.",
    };
  }

  if (status === 429) {
    return {
      error: AI_ERROR_CODES.AI_API_KEY_LIMITED,
      keyStatus: "limited",
      retryable: true,
      cooldownMs: 3600000,
      status,
      message: "API key atingiu limite de uso.",
    };
  }

  if (code === "ECONNABORTED" || code === "ETIMEDOUT" || error?.name === "AbortError") {
    return {
      error: AI_ERROR_CODES.AI_PROVIDER_TIMEOUT,
      keyStatus: "timeout",
      retryable: true,
      cooldownMs: 120000,
      status,
      message: "Timeout ao chamar provedor de IA.",
    };
  }

  if (status >= 500) {
    return {
      error: AI_ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
      keyStatus: "temporary_error",
      retryable: true,
      cooldownMs: 120000,
      status,
      message: "Falha temporária no provedor de IA.",
    };
  }

  return {
    error: AI_ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
    keyStatus: "error",
    retryable: false,
    cooldownMs: 300000,
    status,
    message: error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "Falha ao chamar provedor de IA.",
  };
}

export function isKeyAvailable(keyState) {
  if (!keyState) {
    return true;
  }

  if (keyState.status === "invalid") {
    return false;
  }

  if (keyState.cooldownUntil) {
    return Date.now() > new Date(keyState.cooldownUntil).getTime();
  }

  return true;
}

export function orderKeysForProvider(apiKeys, providerState) {
  const hashedKeys = apiKeys.map((apiKey) => ({
    apiKey,
    hash: hashApiKey(apiKey),
  }));

  const lastWorkingKeyHash = providerState?.lastWorkingKeyHash;
  const lastWorking = [];
  const others = [];

  for (const keyInfo of hashedKeys) {
    if (keyInfo.hash === lastWorkingKeyHash) {
      lastWorking.push(keyInfo);
    } else {
      others.push(keyInfo);
    }
  }

  return [...lastWorking, ...others].filter((keyInfo) => {
    const keyState = providerState?.keys?.find((item) => item.hash === keyInfo.hash);
    return isKeyAvailable(keyState);
  });
}
