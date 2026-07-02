import fs from "node:fs";
import path from "node:path";

import { PREFIX } from "../config.js";

const COOKIE_ROOT_DIR = path.join(
  process.cwd(),
  "assets",
  "private",
  "cookies",
  "yt-dlp",
);

const COOKIE_TYPES = {
  youtube: {
    name: "youtube",
    displayName: "YouTube",
    fileName: "youtube.txt",
    aliases: ["yt", "ytb", "youtube", "youtuber"],
    domains: ["youtube.com", "google.com"],
  },
  instagram: {
    name: "instagram",
    displayName: "Instagram",
    fileName: "instagram.txt",
    aliases: ["ig", "insta", "instagram"],
    domains: ["instagram.com"],
  },
  tiktok: {
    name: "tiktok",
    displayName: "TikTok",
    fileName: "tiktok.txt",
    aliases: ["ttk", "tik", "tik-tok", "tiktok"],
    domains: ["tiktok.com"],
  },
  pinterest: {
    name: "pinterest",
    displayName: "Pinterest",
    fileName: "pinterest.txt",
    aliases: ["pin", "pinterest"],
    domains: ["pinterest.com"],
  },
  facebook: {
    name: "facebook",
    displayName: "Facebook",
    fileName: "facebook.txt",
    aliases: ["fb", "face", "facebook"],
    domains: ["facebook.com", "fb.com"],
  },
};

function ensureCookieDirectory() {
  fs.mkdirSync(COOKIE_ROOT_DIR, { recursive: true });

  const gitignorePath = path.join(COOKIE_ROOT_DIR, ".gitignore");

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, "*\n!.gitignore\n");
  }
}

function formatCommandUsage(command) {
  return `${PREFIX}${command}`;
}

export function listCookieTypes() {
  return Object.values(COOKIE_TYPES).map((type) => type.name);
}

export function normalizeCookieType(input) {
  const value = String(input || "").trim().toLowerCase();

  for (const type of Object.values(COOKIE_TYPES)) {
    if (type.aliases.includes(value)) {
      return type.name;
    }
  }

  return "";
}

export function getCookieTypeInfo(type) {
  const normalizedType = normalizeCookieType(type);

  return COOKIE_TYPES[normalizedType] || null;
}

export function getCookiePath(type) {
  ensureCookieDirectory();

  const info = getCookieTypeInfo(type);

  if (!info) {
    return "";
  }

  return path.join(COOKIE_ROOT_DIR, info.fileName);
}

function sanitizeCookieText(cookieText) {
  return String(cookieText || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function isDomainAllowed(domain, allowedDomains) {
  const cleanDomain = String(domain || "")
    .replace(/^\./, "")
    .toLowerCase();

  return allowedDomains.some((allowedDomain) => {
    const cleanAllowed = allowedDomain.replace(/^\./, "").toLowerCase();

    return cleanDomain === cleanAllowed || cleanDomain.endsWith(`.${cleanAllowed}`);
  });
}

function parseCookieLines(cookieText) {
  const text = sanitizeCookieText(cookieText);
  const lines = text.split("\n");
  const cookies = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const parts = line.split("\t");

    if (parts.length < 7) {
      continue;
    }

    const [domain, includeSubdomains, cookiePath, secure, expires, name, ...valueParts] =
      parts;

    const value = valueParts.join("\t");

    if (!domain || !cookiePath || !name || !value) {
      continue;
    }

    cookies.push({
      domain,
      includeSubdomains,
      path: cookiePath,
      secure,
      expires,
      name,
      value,
      line,
    });
  }

  return cookies;
}

export function validateCookieText(type, cookieText) {
  const info = getCookieTypeInfo(type);

  if (!info) {
    return {
      ok: false,
      reason: `Tipo inválido. Use: ${listCookieTypes().join(", ")}`,
    };
  }

  const text = sanitizeCookieText(cookieText);

  if (!text) {
    return {
      ok: false,
      reason: "Cookie vazio.",
    };
  }

  const cookies = parseCookieLines(text);

  if (!cookies.length) {
    return {
      ok: false,
      reason:
        "O texto não parece estar no formato Netscape cookies.txt. Exporte de novo em formato Netscape.",
    };
  }

  const domainCookies = cookies.filter((cookie) =>
    isDomainAllowed(cookie.domain, info.domains),
  );

  if (!domainCookies.length) {
    return {
      ok: false,
      reason: `O cookie não tem domínio compatível com ${info.displayName}.`,
    };
  }

  return {
    ok: true,
    type: info.name,
    displayName: info.displayName,
    cookieCount: cookies.length,
    domainCookieCount: domainCookies.length,
  };
}

export function validateCookieFile(type) {
  const info = getCookieTypeInfo(type);
  const cookiePath = getCookiePath(type);

  if (!info) {
    return {
      ok: false,
      exists: false,
      path: "",
      reason: `Tipo inválido. Use: ${listCookieTypes().join(", ")}`,
    };
  }

  if (!cookiePath || !fs.existsSync(cookiePath)) {
    return {
      ok: false,
      exists: false,
      path: cookiePath,
      reason: `Cookie de ${info.displayName} não existe.`,
    };
  }

  const cookieText = fs.readFileSync(cookiePath, "utf8");
  const validation = validateCookieText(type, cookieText);

  return {
    ...validation,
    exists: true,
    path: cookiePath,
  };
}

export function saveCookieText(type, cookieText) {
  const info = getCookieTypeInfo(type);

  if (!info) {
    return {
      ok: false,
      reason: `Tipo inválido. Use: ${listCookieTypes().join(", ")}`,
    };
  }

  const normalizedText = sanitizeCookieText(cookieText);
  const validation = validateCookieText(info.name, normalizedText);

  if (!validation.ok) {
    return validation;
  }

  const cookiePath = getCookiePath(info.name);

  ensureCookieDirectory();
  fs.writeFileSync(cookiePath, `${normalizedText}\n`, { mode: 0o600 });

  return {
    ...validation,
    path: cookiePath,
  };
}

export function getValidCookiePath(type) {
  const validation = validateCookieFile(type);

  return validation.ok ? validation.path : "";
}

export function getYtDlpCookieOptions(type, explicitCookiePath = "") {
  const cookiePath = explicitCookiePath || getValidCookiePath(type);

  return cookiePath ? { cookies: cookiePath } : {};
}

export function getCookieHeader(type, explicitCookiePath = "") {
  const cookiePath = explicitCookiePath || getValidCookiePath(type);

  if (!cookiePath || !fs.existsSync(cookiePath)) {
    return "";
  }

  const info = getCookieTypeInfo(type);

  if (!info) {
    return "";
  }

  const cookies = parseCookieLines(fs.readFileSync(cookiePath, "utf8"))
    .filter((cookie) => isDomainAllowed(cookie.domain, info.domains))
    .map((cookie) => `${cookie.name}=${cookie.value}`);

  return [...new Set(cookies)].join("; ");
}

export function isCookieBlockError(error) {
  if (error?.cookieRequired) {
    return true;
  }

  const text = String(
    error?.stderr || error?.stdout || error?.message || error || "",
  ).toLowerCase();

  return [
    "sign in",
    "login",
    "logged in",
    "cookies",
    "cookie",
    "not a bot",
    "confirm you're not a bot",
    "confirm you are not a bot",
    "confirm your age",
    "age-restricted",
    "private video",
    "private content",
    "this content isn't available",
    "this content is not available",
    "http error 401",
    "http error 403",
    "http error 429",
    "forbidden",
    "unauthorized",
    "rate-limit",
    "rate limit",
  ].some((needle) => text.includes(needle));
}

export function createCookieRequiredError(message) {
  const error = new Error(message);
  error.cookieRequired = true;
  return error;
}

function blockedMessage(type) {
  const info = getCookieTypeInfo(type);

  return (
    `${info.displayName} bloqueou a tentativa de download.\n\n` +
    `Crie/importe um cookie para tentar usar comandos relacionados ao ${info.displayName}.\n\n` +
    `Use:\n${formatCommandUsage(`importcookie ${info.name} <cookies.txt colado>`)}\n\n` +
    `Ou envie o arquivo cookies.txt como documento e use:\n${formatCommandUsage(`importcookie ${info.name}`)}`
  );
}

function invalidCookieMessage(type, reason = "") {
  const info = getCookieTypeInfo(type);
  const suffix = reason ? `\n\nMotivo: ${reason}` : "";

  return (
    `${info.displayName} bloqueou a tentativa de download.\n\n` +
    `Tentei utilizar cookie, mas ele era inválido ou não funcionou.${suffix}\n\n` +
    `Exporte um cookies.txt novo e importe novamente com:\n${formatCommandUsage(`importcookie ${info.name}`)}`
  );
}

export async function withCookieFallback(type, operation, options = {}) {
  const info = getCookieTypeInfo(type);

  if (!info) {
    throw new Error(`Tipo de cookie inválido: ${type}`);
  }

  try {
    return await operation({
      cookiesPath: "",
      usingCookies: false,
    });
  } catch (firstError) {
    const shouldTryCookie =
      options.retryOnAnyError || isCookieBlockError(firstError);

    if (!shouldTryCookie) {
      throw firstError;
    }

    const validation = validateCookieFile(info.name);

    if (!validation.exists) {
      throw new Error(blockedMessage(info.name));
    }

    if (!validation.ok) {
      throw new Error(invalidCookieMessage(info.name, validation.reason));
    }

    try {
      return await operation({
        cookiesPath: validation.path,
        usingCookies: true,
      });
    } catch (secondError) {
      throw new Error(
        invalidCookieMessage(
          info.name,
          secondError?.message || "O site continuou bloqueando mesmo com cookie.",
        ),
      );
    }
  }
}

export function getCookieRuntimeInfo(type) {
  const info = getCookieTypeInfo(type);
  const validation = info
    ? validateCookieFile(info.name)
    : { ok: false, exists: false, path: "", reason: "Tipo inválido." };

  return {
    cookiesDir: COOKIE_ROOT_DIR,
    type: info?.name || "",
    displayName: info?.displayName || "",
    exists: validation.exists,
    valid: validation.ok,
    path: validation.path || getCookiePath(type),
    reason: validation.reason || "",
  };
}
