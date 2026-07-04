import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

export default {
  name: "gpt-local",
  description: "Use a inteligência artificial local configurada com Ollama.",
  commands: ["gptlocal", "gpt-local", "localgpt"],
  usage: `${PREFIX}gptlocal explique promises em JavaScript`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendSuccessReply, sendWaitReply, args, fullArgs }) => {
    const text = fullArgs || args.join(" ");

    if (!text) {
      throw new InvalidParameterError(
        "Você precisa me dizer o que a IA local deve responder!",
      );
    }

    await sendWaitReply("Pensando com a IA local...");

    const responseText = await requestAiText({
      provider: "local",
      text,
      allowProviderFallback: false,
    });

    await sendSuccessReply(responseText);
  },
};
