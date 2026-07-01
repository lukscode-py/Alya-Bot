import axios from "axios";

import * as config from "../config.js";
import { getExternalApiToken } from "../utils/database.js";

const { EXTERNAL_API_BASE_URL } = config;

function isExternalApiBaseUrlConfigured(baseUrl) {
  return typeof baseUrl === "string" && baseUrl.trim() !== "";
}

function isExternalApiTokenConfigured(token) {
  return token && token.trim() !== "" && token !== "seu_token_aqui";
}

const messageIfBaseUrlNotConfigured = `URL da API externa não configurada!

Para configurar, entre na pasta: \`src\`
e edite o arquivo \`config.js\`:

Procure por:

\`export const EXTERNAL_API_BASE_URL = readEnv("ALYA_EXTERNAL_API_BASE_URL");\`

Você também pode configurar a variável de ambiente:

\`ALYA_EXTERNAL_API_BASE_URL\``;

const messageIfTokenNotConfigured = `Token da API externa não configurado!
      
Para configurar, entre na pasta: \`src\` 
e edite o arquivo \`config.js\`:

Procure por:

\`export const EXTERNAL_API_TOKEN = "seu_token_aqui";\`

ou

Use o comando:

${config.PREFIX}set-api-token seu_token_aqui

Não esqueça de ver se ${config.PREFIX} é seu prefixo!

Use um token válido do provedor externo configurado para a Alya Bot.`;

export let externalApiTokenConfigured =
  isExternalApiTokenConfigured(getExternalApiToken());

function requireExternalApiToken() {
  if (!isExternalApiBaseUrlConfigured(EXTERNAL_API_BASE_URL)) {
    throw new Error(messageIfBaseUrlNotConfigured);
  }

  const token = getExternalApiToken();
  externalApiTokenConfigured = isExternalApiTokenConfigured(token);

  if (!externalApiTokenConfigured) {
    throw new Error(messageIfTokenNotConfigured);
  }

  return token;
}

export async function play(type, search) {
  if (!search) {
    throw new Error("Você precisa informar o que deseja buscar!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.get(
    `${EXTERNAL_API_BASE_URL}/downloads/play-${type}?search=${encodeURIComponent(
      search,
    )}&api_key=${externalApiToken}`,
  );

  return data;
}

export async function download(type, url) {
  if (!url) {
    throw new Error("Você precisa informar uma URL do que deseja buscar!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.get(
    `${EXTERNAL_API_BASE_URL}/downloads/${type}?url=${encodeURIComponent(
      url,
    )}&api_key=${externalApiToken}`,
  );

  return data;
}

export async function facebook(url) {
  return download("facebook", url);
}

export async function gemini(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.post(
    `${EXTERNAL_API_BASE_URL}/ai/gemini?api_key=${externalApiToken}`,
    {
      text,
    },
  );

  return data.response;
}

export async function gpt5Mini(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.post(
    `${EXTERNAL_API_BASE_URL}/ai/gpt-5-mini?api_key=${externalApiToken}`,
    {
      text,
    },
  );

  return data.response;
}

export async function deepseekV4Flash(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.post(
    `${EXTERNAL_API_BASE_URL}/ai/deepseek-v4-flash?api_key=${externalApiToken}`,
    {
      text,
    },
  );

  return data.response;
}

export async function attp(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(
    text,
  )}&api_key=${externalApiToken}`;
}

export async function ttp(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/stickers/ttp?text=${encodeURIComponent(
    text,
  )}&api_key=${externalApiToken}`;
}

export async function brat(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/stickers/brat?text=${encodeURIComponent(
    text,
  )}&api_key=${externalApiToken}`;
}

export async function abrat(text) {
  if (!text) {
    throw new Error("Você precisa informar o parâmetro de texto!");
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/stickers/abrat?text=${encodeURIComponent(
    text,
  )}&api_key=${externalApiToken}`;
}

export async function pinterest(search) {
  if (!search) {
    throw new Error("Você precisa informar o parâmetro de pesquisa!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.get(
    `${EXTERNAL_API_BASE_URL}/downloads/pinterest?search=${encodeURIComponent(
      search,
    )}&api_key=${externalApiToken}`,
  );

  return data;
}

export async function search(type, search) {
  if (!search) {
    throw new Error("Você precisa informar o parâmetro de pesquisa!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.get(
    `${EXTERNAL_API_BASE_URL}/search/${type}?search=${encodeURIComponent(
      search,
    )}&api_key=${externalApiToken}`,
  );

  return data;
}

export function welcome(title, description, imageURL) {
  if (!title || !description || !imageURL) {
    throw new Error(
      "Você precisa informar o título, descrição e URL da imagem!",
    );
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/canvas/welcome?title=${encodeURIComponent(
    title,
  )}&description=${encodeURIComponent(
    description,
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${externalApiToken}`;
}

export function exit(title, description, imageURL) {
  if (!title || !description || !imageURL) {
    throw new Error(
      "Você precisa informar o título, descrição e URL da imagem!",
    );
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/canvas/goodbye?title=${encodeURIComponent(
    title,
  )}&description=${encodeURIComponent(
    description,
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${externalApiToken}`;
}

export async function imageAI(description) {
  if (!description) {
    throw new Error("Você precisa informar a descrição da imagem!");
  }

  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.get(
    `${EXTERNAL_API_BASE_URL}/ai/flux?text=${encodeURIComponent(
      description,
    )}&api_key=${externalApiToken}`,
  );

  return data;
}

export function canvas(type, imageURL) {
  if (!imageURL) {
    throw new Error("Você precisa informar a URL da imagem!");
  }

  const externalApiToken = requireExternalApiToken();

  return `${EXTERNAL_API_BASE_URL}/canvas/${type}?image_url=${encodeURIComponent(
    imageURL,
  )}&api_key=${externalApiToken}`;
}

export async function updatePlanUser(email, plan) {
  const externalApiToken = requireExternalApiToken();

  const { data } = await axios.post(
    `${EXTERNAL_API_BASE_URL}/internal/update-plan-user?api_key=${externalApiToken}`,
    {
      email,
      plan,
    },
  );

  return data;
}

export async function toGif(buffer) {
  if (!buffer) {
    throw new Error("Você precisa informar o buffer do arquivo!");
  }

  const externalApiToken = requireExternalApiToken();

  const formData = new FormData();
  const blob = new Blob([buffer], { type: "image/webp" });
  formData.append("file", blob, "sticker.webp");

  const { data } = await axios.post(
    `${EXTERNAL_API_BASE_URL}/utilities/to-gif?api_key=${externalApiToken}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return data.url;
}

export async function removeBg(
  buffer,
  mimeType = "image/png",
  fileName = "image.png",
) {
  if (!buffer) {
    throw new Error("Você precisa informar o buffer da imagem!");
  }

  const externalApiToken = requireExternalApiToken();

  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append("image", blob, fileName);

  const { data } = await axios.post(
    `${EXTERNAL_API_BASE_URL}/removebg?api_key=${externalApiToken}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "arraybuffer",
    },
  );

  return Buffer.from(data);
}
