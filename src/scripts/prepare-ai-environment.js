import { aiService } from "../services/ai/index.js";
import { errorLog, infoLog, successLog, warningLog } from "../utils/logger.js";

function enableLocalProviderForPreparation() {
  aiService.loadRuntimeData();

  aiService.config.ai.enabled = true;

  if (!Array.isArray(aiService.config.ai.activeProviders)) {
    aiService.config.ai.activeProviders = [];
  }

  if (!aiService.config.ai.activeProviders.includes("local")) {
    aiService.config.ai.activeProviders.push("local");
  }

  aiService.config.local = {
    ...(aiService.config.local || {}),
    enabled: true,
    autoInstallRuntime: true,
    autoDownloadModel: true,
    askBeforeDownload: false,
  };
}

function printLocalPreparationHelp(result) {
  if (result?.ok) {
    successLog("[AI LOCAL] Ambiente local preparado com sucesso.");
    infoLog("[AI LOCAL] Agora você pode iniciar o bot e usar o comando $gptlocal <mensagem>.");
    return;
  }

  warningLog("[AI LOCAL] O preparo local não foi concluído.");
  warningLog(`[AI LOCAL] Motivo: ${result?.reason || "desconhecido"}`);
  warningLog(
    "[AI LOCAL] Corrija o problema acima ou configure local.runtimePath/modelo em src/config.js.",
  );
}

async function main() {
  infoLog("[AI LOCAL] Preparando ambiente local sem conectar WhatsApp...");
  infoLog("[AI LOCAL] Este script força autoInstallRuntime e autoDownloadModel apenas nesta execução.");

  enableLocalProviderForPreparation();

  const result = await aiService.prepareLocalProvider({
    interactive: false,
  });

  printLocalPreparationHelp(result);

  if (!result?.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  errorLog(`[AI LOCAL] Falha crítica no preparo: ${error.message}`);
  errorLog(error.stack);
  process.exitCode = 1;
});
