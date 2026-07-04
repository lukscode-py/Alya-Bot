import axios from "axios";

function normalizeGeminiRole(role) {
  if (role === "assistant") {
    return "model";
  }

  if (role === "system") {
    return "user";
  }

  return "user";
}

function normalizeGeminiContent(content) {
  if (typeof content === "string") {
    return [{ text: content }];
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return { text: item };
        }

        if (item?.type === "text") {
          return { text: item.text || "" };
        }

        if (item?.text) {
          return { text: item.text };
        }

        return null;
      })
      .filter(Boolean);
  }

  return [{ text: String(content || "") }];
}

function buildGeminiContents(messages) {
  const systemParts = [];
  const contents = [];

  for (const message of messages || []) {
    if (message.role === "system") {
      systemParts.push({ text: String(message.content || "") });
      continue;
    }

    contents.push({
      role: normalizeGeminiRole(message.role),
      parts: normalizeGeminiContent(message.content),
    });
  }

  return {
    systemInstruction: systemParts.length ? { parts: systemParts } : undefined,
    contents,
  };
}

function extractGeminiText(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .filter(Boolean)
      .join("\n")
      .trim() || ""
  );
}

export async function requestGemini({
  providerConfig,
  apiKey,
  model,
  messages,
  options = {},
}) {
  const { systemInstruction, contents } = buildGeminiContents(messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await axios.post(
    url,
    {
      systemInstruction,
      contents,
      generationConfig: {
        temperature: options.temperature ?? providerConfig.temperature,
        topP: options.topP ?? providerConfig.topP,
        topK: options.topK ?? providerConfig.topK,
        maxOutputTokens: options.maxTokens ?? providerConfig.maxTokens,
      },
    },
    {
      timeout: options.timeout || providerConfig.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        ...(providerConfig.headers || {}),
        ...(options.headers || {}),
      },
    },
  );

  return {
    text: extractGeminiText(response.data),
    data: response.data,
    usage: response.data?.usageMetadata,
    finishReason: response.data?.candidates?.[0]?.finishReason,
  };
}
