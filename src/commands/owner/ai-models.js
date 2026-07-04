import { PREFIX } from "../../config.js";
import { aiService } from "../../services/ai/index.js";
import { formatModelsRegistry } from "../../services/ai/formatters.js";

export default {
  name: "ai-models",
  description: "Lista os modelos locais cadastrados para IA local.",
  commands: ["ai-models", "ia-modelos", "ai-modelos"],
  usage: `${PREFIX}ai-models`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendReply }) => {
    aiService.reloadConfig();
    await sendReply(formatModelsRegistry(aiService.getModelsRegistry()));
  },
};
