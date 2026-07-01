import { PREFIX } from "../../config.js";
import { InvalidParameterError } from "../../errors/index.js";
import { parseDurationToMs } from "../../utils/admin-command-utils.js";
import { errorLog } from "../../utils/logger.js";

const USAGE = `${PREFIX}agendar-mensagem mensagem / tempo

Exemplo: ${PREFIX}agendar-mensagem Reunião amanhã / 10m`;

function parseScheduleArgs(args) {
  if (args.length !== 2) {
    throw new InvalidParameterError(`Formato incorreto. Use: ${USAGE}`);
  }

  const message = args[0].trim();
  const rawDuration = args[1].trim();
  const durationMs = parseDurationToMs(rawDuration);

  if (!message) {
    throw new InvalidParameterError("A mensagem agendada não pode ficar vazia.");
  }

  if (!durationMs) {
    throw new InvalidParameterError(
      "Formato de tempo inválido.\nUse:\n• 10s para 10 segundos\n• 5m para 5 minutos\n• 2h para 2 horas",
    );
  }

  return { message, rawDuration, durationMs };
}

function scheduleMessage({ sendText, message, durationMs }) {
  setTimeout(() => {
    sendText(`⏰ *Mensagem agendada:*\n\n${message}`).catch((error) => {
      errorLog(`Erro ao enviar mensagem agendada: ${error.message}`);
    });
  }, durationMs);
}

export default {
  name: "agendar-mensagem",
  description: "Agenda uma mensagem para ser enviada após um tempo definido.",
  commands: ["agendar", "agendar-mensagem"],
  usage: USAGE,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ args, sendSuccessReply, sendText }) => {
    const { message, rawDuration, durationMs } = parseScheduleArgs(args);

    scheduleMessage({ sendText, message, durationMs });

    await sendSuccessReply(`⌚ Mensagem agendada para daqui a ${rawDuration}...`);
  },
};
