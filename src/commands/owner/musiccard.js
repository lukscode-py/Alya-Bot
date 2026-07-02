import { PREFIX } from "../../config.js";
import { DangerError, InvalidParameterError } from "../../errors/index.js";
import { isBotOwner } from "../../middlewares/index.js";
import {
  getMusicCardTemplate,
  listMusicCardTemplates,
  setMusicCardTemplate,
} from "../../utils/database.js";

const VALID_TEMPLATES = listMusicCardTemplates();

function assertOwner(userLid) {
  if (!isBotOwner({ userLid })) {
    throw new DangerError("Apenas o dono do bot pode alterar o card de música!");
  }
}

function buildUsage() {
  return `${PREFIX}musiccard <${VALID_TEMPLATES.join("|")}>`;
}

function validateTemplate(template) {
  if (!template) {
    throw new InvalidParameterError(
      `Você precisa informar o tipo do card.\n\nUso: ${buildUsage()}`,
    );
  }

  const normalizedTemplate = String(template).trim().toLowerCase();

  if (!VALID_TEMPLATES.includes(normalizedTemplate)) {
    throw new InvalidParameterError(
      `Tipo de card inválido: ${template}\n\nUse: ${VALID_TEMPLATES.join(" ou ")}`,
    );
  }

  return normalizedTemplate;
}

export default {
  name: "musiccard",
  description: "Altera o modelo do card de música usado nos comandos de play.",
  commands: ["musiccard", "music-card", "set-musiccard", "set-music-card"],
  usage: buildUsage(),
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendSuccessReply, userLid }) => {
    assertOwner(userLid);

    if (!args.length) {
      await sendSuccessReply(
        `Card de música atual: ${getMusicCardTemplate()}\n\nUso: ${buildUsage()}`,
      );
      return;
    }

    const selectedTemplate = validateTemplate(args[0]);
    const savedTemplate = setMusicCardTemplate(selectedTemplate);

    await sendSuccessReply(
      `Card de música atualizado para: ${savedTemplate}\n\nEssa configuração foi salva permanentemente.`,
    );
  },
};
