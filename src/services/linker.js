import axios from "axios";
import FormData from "form-data";
import { LINKER_API_KEY, LINKER_BASE_URL } from "../config.js";

function isConfigured(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isApiKeyConfigured(value) {
  return isConfigured(value) && value !== "seu_token_aqui";
}

function normalizeBaseUrl(baseUrl) {
  const trimmedBaseUrl = baseUrl.trim();

  return trimmedBaseUrl.endsWith("/")
    ? trimmedBaseUrl.slice(0, -1)
    : trimmedBaseUrl;
}

let linkerAPIKeyConfigured = isApiKeyConfigured(LINKER_API_KEY);

const messageIfBaseUrlNotConfigured = `URL do serviço de upload não configurada!

Para configurar, entre na pasta: \`src\`
e edite o arquivo \`config.js\`:

Procure por:

\`export const LINKER_BASE_URL = readEnv("ALYA_LINK_UPLOAD_BASE_URL");\`

Você também pode configurar a variável de ambiente:

\`ALYA_LINK_UPLOAD_BASE_URL\``;

const messageIfKeyNotConfigured = `API Key do serviço de upload não configurada!
      
Para configurar, entre na pasta: \`src\` 
e edite o arquivo \`config.js\`:

Procure por:

\`export const LINKER_API_KEY = readEnv("ALYA_LINK_UPLOAD_API_KEY", "seu_token_aqui");\`

Você também pode configurar a variável de ambiente:

\`ALYA_LINK_UPLOAD_API_KEY\``;

export async function upload(imageBuffer, filename) {
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new Error("O primeiro parâmetro deve ser um Buffer válido!");
  }

  if (typeof filename !== "string" || filename.trim() === "") {
    throw new Error("O segundo parâmetro deve ser o nome do arquivo!");
  }

  if (imageBuffer.length === 0) {
    throw new Error("O buffer da imagem está vazio!");
  }

  if (!isConfigured(LINKER_BASE_URL)) {
    throw new Error(messageIfBaseUrlNotConfigured);
  }

  linkerAPIKeyConfigured = isApiKeyConfigured(LINKER_API_KEY);

  if (!linkerAPIKeyConfigured) {
    throw new Error(messageIfKeyNotConfigured);
  }

  const formData = new FormData();
  formData.append("file", imageBuffer, {
    filename: filename,
    contentType: "image/jpeg",
  });

  const response = await axios.post(
    `${normalizeBaseUrl(LINKER_BASE_URL)}/upload`,
    formData,
    {
      headers: {
        "X-API-Key": LINKER_API_KEY,
        ...formData.getHeaders(),
      },
    },
  );

  const result = response.data;

  if (!result.url) {
    throw new Error(`Erro na API: ${result.error || "Erro desconhecido"}`);
  }

  return result.url;
}
