import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { setExternalApiToken } from "../../utils/database.js";

const MIN_TOKEN_LENGTH = 8;
const MAX_TOKEN_LENGTH = 200;

function readToken(args) {
  return args.join(" ").trim();
}

function validateToken(token) {
  if (!token) {
    throw new InvalidParameterError("Você deve fornecer um token!");
  }

  if (token.length < MIN_TOKEN_LENGTH || token.length > MAX_TOKEN_LENGTH) {
    throw new InvalidParameterError(
      `O token deve ter entre ${MIN_TOKEN_LENGTH} e ${MAX_TOKEN_LENGTH} caracteres!`,
    );
  }
}

export default {
  name: "set-api-token",
  description: "Atualiza o token da API externa configurada na Alya.",
  commands: [
    "set-api-token",
    "set-external-api-token",
    "alterar-api-token",
    "mudar-api-token",
    "api-token",
  ],
  usage: `${PREFIX}set-api-token token aqui`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendSuccessReply }) => {
    const newToken = readToken(args);

    validateToken(newToken);
    setExternalApiToken(newToken);

    await sendSuccessReply("Token da API externa atualizado com sucesso!");
  },
};
