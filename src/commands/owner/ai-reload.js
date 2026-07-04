import { PREFIX } from "../../config.js";
import { aiService } from "../../services/ai/index.js";
import { formatReloadResult } from "../../services/ai/formatters.js";

export default {
  name: "ai-reload",
  description: "Recarrega a configuração do serviço central de IA.",
  commands: ["ai-reload", "ia-reload", "reload-ai"],
  usage: `${PREFIX}ai-reload`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendSuccessReply }) => {
    const runtimeData = aiService.reloadConfig();
    await sendSuccessReply(formatReloadResult(runtimeData));
  },
};
