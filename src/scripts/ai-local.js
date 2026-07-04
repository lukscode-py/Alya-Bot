#!/usr/bin/env node
import { aiService } from "../services/ai/index.js";
import {
  deleteOllamaModel,
  ensureOllamaModel,
  ensureOllamaServer,
  getLocalRuntimeStatus,
  installLocalRuntime,
  listOllamaModels,
} from "../services/ai/local-runtime.js";
import { getLocalRuntimeManualInstructions } from "../services/ai/local-instructions.js";

function printHelp() {
  console.log([
    "Uso:",
    "  node src/scripts/ai-local.js status",
    "  node src/scripts/ai-local.js install",
    "  node src/scripts/ai-local.js serve",
    "  node src/scripts/ai-local.js pull <modelo>",
    "  node src/scripts/ai-local.js delete <modelo>",
    "  node src/scripts/ai-local.js list",
    "  node src/scripts/ai-local.js run <prompt>",
    "",
    "Exemplos:",
    "  node src/scripts/ai-local.js pull qwen2.5:0.5b",
    "  node src/scripts/ai-local.js delete qwen2.5:0.5b",
    "  node src/scripts/ai-local.js run Responda apenas OK",
  ].join("\n"));
}

function loadLocalConfig() {
  aiService.loadRuntimeData();
  aiService.config.local = {
    ...(aiService.config.local || {}),
    enabled: true,
    provider: "ollama",
    autoStartServer: true,
    autoDownloadModel: true,
  };

  return aiService.config.local;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const localConfig = loadLocalConfig();

  if (!command || ["help", "-h", "--help"].includes(command)) {
    printHelp();
    return;
  }

  if (command === "status") {
    const runtime = await getLocalRuntimeStatus(localConfig);
    const server = runtime.ready
      ? await listOllamaModels({ providerConfig: localConfig }).catch((error) => ({
          ok: false,
          error: error.message,
        }))
      : { ok: false, error: "runtime-not-ready" };

    console.log(JSON.stringify({ runtime, server }, null, 2));
    return;
  }

  if (command === "install") {
    const result = await installLocalRuntime({
      providerConfig: localConfig,
      onLog: console.log,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "serve") {
    const result = await ensureOllamaServer({
      providerConfig: localConfig,
      onLog: console.log,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "pull") {
    const model = args[0] || localConfig.selectedModel;
    const result = await ensureOllamaModel({
      providerConfig: localConfig,
      model,
      onLog: console.log,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "delete" || command === "remove" || command === "rm") {
    const model = args[0];

    if (!model) {
      throw new Error("Informe o modelo para apagar. Exemplo: node src/scripts/ai-local.js delete qwen2.5:0.5b");
    }

    const result = await deleteOllamaModel({
      providerConfig: localConfig,
      model,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "list") {
    const result = await listOllamaModels({
      providerConfig: localConfig,
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "run") {
    const prompt = args.join(" ").trim();

    if (!prompt) {
      throw new Error("Informe o prompt. Exemplo: node src/scripts/ai-local.js run Responda apenas OK");
    }

    aiService.config.ai.enabled = true;
    aiService.config.ai.activeProviders = ["local"];
    aiService.initialized = true;

    const result = await aiService.request({
      provider: "local",
      allowProviderFallback: false,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Comando desconhecido: ${command}`);
}

main().catch((error) => {
  console.error(error.message);
  console.error("");
  console.error(getLocalRuntimeManualInstructions());
  process.exitCode = 1;
});
