import { PREFIX } from "../../config.js";
import { aiService } from "../../services/ai/index.js";
import { formatAllProviderTests } from "../../services/ai/formatters.js";

export default {
  name: "ai-test-all",
  description: "Testa todos os provedores ativos do serviço central de IA.",
  commands: ["ai-test-all", "ia-test-all", "test-all-ai"],
  usage: `${PREFIX}ai-test-all`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendWaitReply, sendReply }) => {
    await sendWaitReply("Testando provedores ativos de IA...");

    aiService.reloadConfig();
    const result = await aiService.testAllProviders();

    await sendReply(formatAllProviderTests(result));
  },
};
