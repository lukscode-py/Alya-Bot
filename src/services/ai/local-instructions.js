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
      "[AI LOCAL] Instalação recomendada para Termux:",
      "",
      "pkg update",
      "pkg install -y llama-cpp",
      "",
      "Depois valide:",
      "command -v llama-cli && llama-cli --help",
      "",
      "Se funcionar, rode novamente:",
      "./prepare-ai-ambiente.sh",
    ].join("\n");
  }

  return [
    `[AI LOCAL] Instalação manual recomendada para ${getPlatformLabel()}:`,
    "",
    "1. Abra a página oficial de releases do llama.cpp:",
    "https://github.com/ggml-org/llama.cpp/releases",
    "",
    "2. Baixe o binário compilado compatível com seu sistema.",
    "   Exemplos:",
    "   - Linux x64: Ubuntu x64 (CPU)",
    "   - Windows x64: Windows x64 (CPU)",
    "   - macOS Apple Silicon: macOS Apple Silicon (arm64)",
    "   - macOS Intel: macOS Intel (x64)",
    "",
    "3. Extraia o arquivo baixado.",
    "",
    "4. Ache o executável llama-cli dentro da pasta extraída.",
    "",
    "5. No src/config.js, configure:",
    "",
    'local: {',
    '  runtimePath: "/caminho/completo/para/llama-cli"',
    "}",
    "",
    "6. Rode novamente:",
    "./prepare-ai-ambiente.sh",
  ].join("\n");
}
