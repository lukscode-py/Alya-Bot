import { PREFIX } from "../../config.js";
import { aiService } from "../../services/ai/index.js";
import { formatAiStatus } from "../../services/ai/formatters.js";

export default {
  name: "ai-status",
  description: "Mostra o status seguro do serviço central de IA.",
  commands: ["ai-status", "ia-status"],
  usage: `${PREFIX}ai-status`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply }) => {
    aiService.reloadConfig();
    await sendReply(formatAiStatus(aiService.getProviderStatus()));
  },
};
