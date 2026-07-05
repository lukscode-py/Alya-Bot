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

function buildChatPayload({ selectedModel, messages, options, providerConfig, stream }) {
  return {
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
    stream,
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
  };
}

function parseOllamaChatLine(line) {
  const trimmedLine = String(line || "").trim();

  if (!trimmedLine) {
    return null;
  }

  try {
    return JSON.parse(trimmedLine);
  } catch {
    return null;
  }
}

async function consumeChatStream(stream, onToken) {
  let buffer = "";
  let text = "";
  let finishReason = "";
  let lastEvent = null;

  for await (const chunk of stream) {
    buffer += chunk.toString("utf8");

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      const event = parseOllamaChatLine(line);

      if (!event) {
        continue;
      }

      if (event.error) {
        throw new Error(event.error);
      }

      lastEvent = event;
      finishReason = event.done_reason || finishReason;

      const token = event.message?.content || event.response || "";

      if (token) {
        text += token;
        await onToken(token, text);
      }
    }
  }

  const finalEvent = parseOllamaChatLine(buffer);

  if (finalEvent?.error) {
    throw new Error(finalEvent.error);
  }

  if (finalEvent) {
    lastEvent = finalEvent;
    finishReason = finalEvent.done_reason || finishReason;

    const token = finalEvent.message?.content || finalEvent.response || "";

    if (token) {
      text += token;
      await onToken(token, text);
    }
  }

  return {
    text: text.trim(),
    finishReason,
    lastEvent,
  };
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
    if (options.stream && typeof options.onToken === "function") {
      const response = await axios.post(
        `${baseUrl}/api/chat`,
        buildChatPayload({
          selectedModel,
          messages,
          options,
          providerConfig,
          stream: true,
        }),
        {
          timeout: options.timeout || providerConfig.timeout || 120000,
          responseType: "stream",
          validateStatus: () => true,
        },
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          response.data?.error || `Falha ao consultar Ollama local. HTTP ${response.status}`,
        );
      }

      const streamed = await consumeChatStream(response.data, options.onToken);

      return {
        text: streamed.text,
        data: {
          baseUrl,
          model: selectedModel,
          runtime: "ollama",
          streamed: true,
        },
        usage: streamed.lastEvent
          ? {
              promptEvalCount: streamed.lastEvent.prompt_eval_count,
              evalCount: streamed.lastEvent.eval_count,
              totalDuration: streamed.lastEvent.total_duration,
            }
          : undefined,
        finishReason: streamed.finishReason,
      };
    }

    const response = await axios.post(
      `${baseUrl}/api/chat`,
      buildChatPayload({
        selectedModel,
        messages,
        options,
        providerConfig,
        stream: false,
      }),
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
