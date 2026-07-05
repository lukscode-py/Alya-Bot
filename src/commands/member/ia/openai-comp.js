import { PREFIX } from "../../../config.js";
import { InvalidParameterError } from "../../../errors/index.js";
import { requestAiText } from "../../../services/ai/command-utils.js";

export default {
  name: "openai-comp",
  description: "Use a inteligência artificial configurada no provedor OpenAI Compatible.",
  commands: ["openai-comp", "openai-compatible", "openaicomp", "ai-comp"],
  usage: `${PREFIX}openai-comp explique async/await em JavaScript`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendSuccessReply, sendWaitReply, args, fullArgs }) => {
    const text = fullArgs || args.join(" ");

    if (!text) {
      throw new InvalidParameterError(
        "Você precisa me dizer o que o provedor OpenAI Compatible deve responder!",
      );
    }

    await sendWaitReply("Pensando com OpenAI Compatible...");

    const responseText = await requestAiText({
      provider: "openaiCompatible",
      text,
      allowProviderFallback: false,
    });

    await sendSuccessReply(responseText);
  },
};
