import { exec as execChild } from "node:child_process";

const DANGEROUS_COMMANDS = [
  ":()",
  "mkfs",
  "fdisk",
  "parted",
  "format",
  "halt",
  "poweroff",
  "reboot",
  "shutdown",
  "init 0",
  "init 6",
];

const DANGEROUS_PATTERNS = [
  /:\(\)\s*\{/i,
  /rm\s+-rf\s+\/($|\s)/i,
  /rm\s+-rf\s+~\/\*/i,
  /rm\s+-rf\s+\*($|\s)/i,
  /dd\s+.*of=\/dev\/sd[a-z]/i,
  /mkfs\.[a-z]+\s+\/dev/i,
  /:\(\)\s*\{.*fork/i,
  /curl.*\|\s*bash/i,
  /wget.*\|\s*bash/i,
  /curl.*\|\s*sh/i,
  /wget.*\|\s*sh/i,
  /chmod\s+777\s+\//i,
  /chown\s+.*\s+\//i,
  />\s*\/dev\/sd[a-z]/i,
];

const EXEC_TIMEOUT_MS = 15_000;
const EXEC_MAX_BUFFER = 1024 * 1024;
const MAX_OUTPUT_LENGTH = 3500;

export function checkShellCommandSafety(command) {
  const trimmedCommand = String(command || "").trim();
  const lowerCommand = trimmedCommand.toLowerCase();

  for (const dangerous of DANGEROUS_COMMANDS) {
    if (lowerCommand.includes(dangerous.toLowerCase())) {
      return {
        safe: false,
        reason: `Comando perigoso detectado: ${dangerous}`,
      };
    }
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmedCommand)) {
      return {
        safe: false,
        reason: "Padrão perigoso detectado: operação destrutiva bloqueada",
      };
    }
  }

  return { safe: true };
}

export function runShellCommand(command) {
  return new Promise((resolve) => {
    execChild(
      command,
      {
        timeout: EXEC_TIMEOUT_MS,
        maxBuffer: EXEC_MAX_BUFFER,
      },
      (error, stdout, stderr) => {
        resolve({ error, stdout, stderr });
      },
    );
  });
}

export function formatExecError(error) {
  if (!error) {
    return null;
  }

  if (error.code === "ETIMEDOUT") {
    return "⏱️ Comando cancelado por timeout (15s)";
  }

  if (error.message?.includes("maxBuffer")) {
    return "📊 Saída muito grande, comando cancelado";
  }

  return error.message;
}

export function sanitizeShellOutput(output) {
  const rawOutput = String(output || "Comando executado sem saída.");
  const truncatedOutput =
    rawOutput.length > MAX_OUTPUT_LENGTH
      ? `${rawOutput.substring(0, MAX_OUTPUT_LENGTH)}\n\n... (saída truncada)`
      : rawOutput;

  return truncatedOutput.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}
