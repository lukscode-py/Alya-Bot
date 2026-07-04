import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { aiService } from "../../services/ai/index.js";
import { formatProviderTestResult } from "../../services/ai/formatters.js";

export default {
  name: "ai-test",
  description: "Testa um provedor específico do serviço central de IA.",
  commands: ["ai-test", "ia-test", "test-ai", "test-ia"],
  usage: `${PREFIX}ai-test gemini`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendWaitReply, sendReply }) => {
    const providerName = String(args[0] || "").trim();

    if (!providerName) {
      throw new InvalidParameterError(
        `Informe o provedor. Exemplo: ${PREFIX}ai-test gemini`,
      );
    }

    await sendWaitReply(`Testando provedor ${providerName}...`);

    aiService.reloadConfig();
    const result = await aiService.testProvider(providerName);

    await sendReply(formatProviderTestResult(providerName, result));
  },
};
