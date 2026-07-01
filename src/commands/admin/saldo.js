import axios from "axios";
import { PREFIX, SPIDER_API_BASE_URL } from "../../config.js";
import { DangerError } from "../../errors/index.js";
import { getSpiderApiToken } from "../../utils/database.js";
import { formatExternalApiBalance } from "../../utils/remote-service.js";

function normalizeBaseUrl(baseUrl) {
  return typeof baseUrl === "string" ? baseUrl.trim().replace(/\/+$/, "") : "";
}

function ensureBalanceConfig(token) {
  if (!normalizeBaseUrl(SPIDER_API_BASE_URL)) {
    throw new DangerError(
      "URL da API externa não configurada. Configure ALYA_EXTERNAL_API_BASE_URL ou edite src/config.js.",
    );
  }

  if (!token || token === "seu_token_aqui") {
    throw new DangerError(
      "Token da API externa não configurado. Use o comando de token ou edite src/config.js.",
    );
  }
}

function buildBalanceUrl(token) {
  return `${normalizeBaseUrl(SPIDER_API_BASE_URL)}/saldo?api_key=${token}`;
}

function getBalanceErrorMessage(error) {
  return error.response?.data?.message || error.message || "Erro desconhecido";
}

async function requestExternalApiBalance(token) {
  try {
    const response = await axios.get(buildBalanceUrl(token));

    if (!response.data?.success) {
      throw new DangerError(
        `Erro ao consultar saldo da API externa! ${response.data?.message || "Resposta inválida"}`,
      );
    }

    return response.data;
  } catch (error) {
    if (error instanceof DangerError) {
      throw error;
    }

    throw new DangerError(
      `Erro ao consultar saldo da API externa! ${getBalanceErrorMessage(error)}`,
    );
  }
}

export default {
  name: "saldo",
  description: "Consulta o saldo de requests do provedor externo configurado.",
  commands: ["saldo", "balance", "api-balance", "saldo-api"],
  usage: `${PREFIX}saldo`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ sendSuccessReply }) => {
    const token = getSpiderApiToken();

    ensureBalanceConfig(token);

    const balance = await requestExternalApiBalance(token);

    await sendSuccessReply(formatExternalApiBalance(balance));
  },
};
