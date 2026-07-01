import { PREFIX } from "../../config.js";
import { DangerError } from "../../errors/index.js";
import { isBotOwner } from "../../middlewares/index.js";
import {
  checkShellCommandSafety,
  formatExecError,
  runShellCommand,
  sanitizeShellOutput,
} from "../../utils/owner-exec-utils.js";

const USAGE = `${PREFIX}exec comando

Apenas comandos destrutivos do sistema são bloqueados.

Exemplos permitidos:
- ls, pwd, cat arquivo.txt
- npm install, yarn add, pnpm install
- git status, git pull, git commit
- node script.js, python arquivo.py
- rm arquivo.txt, mv origem destino
- chmod 755 script.sh
- mkdir, touch, cp, etc.

Este comando pode causar danos críticos ao sistema.`;

function assertOwner(userLid) {
  if (!isBotOwner({ userLid })) {
    throw new DangerError("Apenas o dono do bot pode usar este comando!");
  }
}

function assertCommandInput(fullArgs) {
  if (!fullArgs?.trim()) {
    throw new DangerError(`Uso correto: ${USAGE}`);
  }
}

function assertSafeCommand(command) {
  const safetyCheck = checkShellCommandSafety(command);

  if (!safetyCheck.safe) {
    throw new DangerError(
      `⛔ Comando bloqueado por segurança!\n\nMotivo: ${safetyCheck.reason}\n\nEste comando pode causar danos críticos ao sistema.`,
    );
  }
}

export default {
  name: "exec",
  description: "Executa comandos do terminal diretamente pelo bot.",
  commands: ["exec"],
  usage: USAGE,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ fullArgs, sendSuccessReply, sendErrorReply, userLid }) => {
    assertOwner(userLid);
    assertCommandInput(fullArgs);
    assertSafeCommand(fullArgs);

    const { error, stdout, stderr } = await runShellCommand(fullArgs);
    const errorMessage = formatExecError(error);

    if (errorMessage) {
      await sendErrorReply(errorMessage);
    }

    const output = sanitizeShellOutput(stdout || stderr);

    await sendSuccessReply(
      `Resultado do comando: \`${fullArgs}\`\n\n` +
        `\`\`\`\n${output.trim()}\n\`\`\``,
    );
  },
};
