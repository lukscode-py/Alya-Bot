import axios from "axios";
import { AI_ERROR_CODES, createAiError } from "../errors.js";

function normalizeBaseURL(baseURL) {
  return typeof baseURL === "string" ? baseURL.trim().replace(/\/+$/, "") : "";
}

function extractOpenAiText(data) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text || item?.content || "")
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

export async function requestOpenAiCompatible({
  providerName,
  providerConfig,
  apiKey,
  model,
  messages,
  options = {},
}) {
  const baseURL = normalizeBaseURL(providerConfig.baseURL);

  if (!baseURL) {
    throw createAiError(
      AI_ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
      `baseURL não configurada para o provedor ${providerName}.`,
      { provider: providerName, model },
    );
  }

  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages,
      temperature: options.temperature ?? providerConfig.temperature,
      top_p: options.topP ?? providerConfig.topP,
      max_tokens: options.maxTokens ?? providerConfig.maxTokens,
      stream: false,
      ...(options.body || {}),
    },
    {
      timeout: options.timeout || providerConfig.timeout || 30000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(providerConfig.headers || {}),
        ...(options.headers || {}),
      },
    },
  );

  return {
    text: extractOpenAiText(response.data),
    data: response.data,
    usage: response.data?.usage,
    finishReason: response.data?.choices?.[0]?.finish_reason,
  };
}
