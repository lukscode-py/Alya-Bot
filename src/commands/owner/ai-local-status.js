import { PREFIX } from "../../config.js";
import { aiService } from "../../services/ai/index.js";
import { formatLocalStatus } from "../../services/ai/formatters.js";

export default {
  name: "ai-local-status",
  description: "Mostra status do provedor local Ollama.",
  commands: ["ai-local-status", "ia-local-status"],
  usage: `${PREFIX}ai-local-status`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply }) => {
    aiService.reloadConfig();
    await sendReply(formatLocalStatus(aiService.getLocalStatus()));
  },
};
