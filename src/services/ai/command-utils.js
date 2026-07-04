import { WarningError } from "../../errors/index.js";
import { aiService } from "./index.js";

function extractFailureDetails(result) {
  if (!result?.attempts?.length) {
    return result?.message || "Falha desconhecida no serviço de IA.";
  }

  return result.attempts
    .map((attempt) => {
      const error = attempt.error?.error || "erro";
      const message = attempt.error?.message || "sem mensagem";
      return `${attempt.provider}: ${error} - ${message}`;
    })
    .join("\n");
}

export function buildUserTextMessages(text, systemPrompt = "") {
  const messages = [];

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: text,
  });

  return messages;
}

export function assertAiResultText(result) {
  if (result?.ok && result.text) {
    return result.text;
  }

  if (result?.ok && !result.text) {
    throw new WarningError("O provedor de IA respondeu vazio.");
  }

  throw new WarningError(
    [
      "Não foi possível obter resposta da IA.",
      "",
      extractFailureDetails(result),
    ].join("\n"),
  );
}

export async function requestAiText({
  provider,
  model,
  text,
  systemPrompt = "",
  allowProviderFallback = true,
  options = {},
}) {
  const result = await aiService.request({
    provider,
    model,
    allowProviderFallback,
    messages: buildUserTextMessages(text, systemPrompt),
    ...options,
  });

  return assertAiResultText(result);
}
