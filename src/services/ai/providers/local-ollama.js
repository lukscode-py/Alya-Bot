import axios from "axios";
import { AI_ERROR_CODES, createAiError } from "../errors.js";
import { ensureOllamaModel, ensureOllamaServer } from "../local-runtime.js";

function normalizeBaseUrl(baseUrl = "") {
  return String(baseUrl || "http://127.0.0.1:11434").replace(/\/+$/, "");
}

function messagesToPrompt(messages = []) {
  return messages
    .map((message) => {
      const role = message.role || "user";
      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content || "");

      return `${role.toUpperCase()}: ${content}`;
    })
    .join("\n\n");
}

export async function requestLocalOllama({
  providerConfig,
  model,
  messages,
  options = {},
}) {
  const selectedModel = model || providerConfig.selectedModel;
  const baseUrl = normalizeBaseUrl(providerConfig.baseUrl);

  if (!selectedModel) {
    throw createAiError(
      AI_ERROR_CODES.AI_MODEL_NOT_FOUND,
      "Nenhum modelo Ollama local foi selecionado.",
      { provider: "local" },
    );
  }

  await ensureOllamaServer({
    providerConfig,
  });

  if (providerConfig.autoDownloadModel !== false) {
    await ensureOllamaModel({
      providerConfig,
      model: selectedModel,
    });
  }

  try {
    const response = await axios.post(
      `${baseUrl}/api/chat`,
      {
        model: selectedModel,
        messages:
          messages?.length
            ? messages
            : [
                {
                  role: "user",
                  content: options.prompt || messagesToPrompt(messages),
                },
              ],
        stream: false,
        options: {
          temperature: options.temperature ?? providerConfig.temperature ?? 0.7,
          top_p: options.topP ?? providerConfig.topP ?? 0.9,
          top_k: options.topK ?? providerConfig.topK ?? 40,
          repeat_penalty:
            options.repeatPenalty ?? providerConfig.repeatPenalty ?? 1.1,
          num_ctx: options.contextSize ?? providerConfig.contextSize ?? 2048,
          num_predict: options.maxTokens ?? providerConfig.maxTokens ?? 512,
          num_thread: options.threads ?? providerConfig.threads ?? 4,
        },
      },
      {
        timeout: options.timeout || providerConfig.timeout || 120000,
      },
    );

    return {
      text: response.data?.message?.content?.trim() || "",
      data: {
        baseUrl,
        model: selectedModel,
        runtime: "ollama",
      },
      usage: response.data
        ? {
            promptEvalCount: response.data.prompt_eval_count,
            evalCount: response.data.eval_count,
            totalDuration: response.data.total_duration,
          }
        : undefined,
      finishReason: response.data?.done_reason,
    };
  } catch (error) {
    throw createAiError(
      AI_ERROR_CODES.AI_LOCAL_MODEL_LOAD_FAILED,
      error.response?.data?.error || error.message || "Falha ao consultar Ollama local.",
      { provider: "local", model: selectedModel },
    );
  }
}
