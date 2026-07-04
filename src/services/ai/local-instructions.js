import os from "node:os";

function isTermux() {
  return Boolean(process.env.PREFIX?.includes("com.termux"));
}

function getPlatformLabel() {
  if (isTermux()) {
    return "termux";
  }

  return `${process.platform}/${os.arch()}`;
}

export function getLocalRuntimeManualInstructions() {
  if (isTermux()) {
    return [
      "[AI LOCAL] Instalação automática recomendada para Termux:",
      "",
      "pkg update -y",
      "pkg upgrade -y",
      "pkg install tur-repo -y",
      "pkg install ollama -y",
      "",
      "Depois valide:",
      "ollama --version",
      "",
      "O bot iniciará o servidor com ollama serve quando necessário.",
      "Para preparar modelo default, rode:",
      "./prepare-ai-ambiente.sh",
    ].join("\n");
  }

  if (process.platform === "linux") {
    return [
      `[AI LOCAL] Instalação automática recomendada para ${getPlatformLabel()}:`,
      "",
      "curl -fsSL https://ollama.com/install.sh | sh",
      "",
      "Depois valide:",
      "ollama --version",
      "",
      "O bot iniciará o servidor com ollama serve quando necessário.",
      "Para preparar modelo default, rode:",
      "./prepare-ai-ambiente.sh",
    ].join("\n");
  }

  if (process.platform === "win32") {
    return [
      `[AI LOCAL] Instalação recomendada para ${getPlatformLabel()}:`,
      "",
      "Abra o PowerShell como Administrador e execute:",
      "irm https://ollama.com/install.ps1 | iex",
      "",
      "Depois valide:",
      "ollama --version",
      "",
      "O bot iniciará o servidor com ollama serve quando necessário.",
      "Para preparar modelo default, rode:",
      "./prepare-ai-ambiente.sh",
    ].join("\n");
  }

  return [
    `[AI LOCAL] Instalação recomendada para ${getPlatformLabel()}:`,
    "",
    "Instale o Ollama pelo instalador oficial do seu sistema.",
    "",
    "Depois valide:",
    "ollama --version",
    "",
    "O bot iniciará o servidor com ollama serve quando necessário.",
    "Para preparar modelo default, rode:",
    "./prepare-ai-ambiente.sh",
  ].join("\n");
}
