import { PREFIX } from "../../config.js";
import { WarningError } from "../../errors/index.js";
import { checkIfMemberIsMuted, unmuteMember } from "../../utils/database.js";
import {
  assertGroupCommand,
  assertMemberTarget,
  getMemberTargetNumber,
  resolveMemberTargetLid,
} from "../../utils/admin-command-utils.js";

function buildUsageMessage() {
  return `Você precisa mencionar um usuário ou responder à mensagem do usuário que deseja desmutar.

Exemplo: ${PREFIX}unmute @fulano`;
}

export default {
  name: "unmute",
  description: "Remove o mute de um membro do grupo.",
  commands: ["unmute", "desmutar"],
  usage: `${PREFIX}unmute @usuario ou responda à mensagem do usuário silenciado`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ remoteJid, sendSuccessReply, args, isGroup, replyLid }) => {
    assertGroupCommand(isGroup);

    const targetLid = resolveMemberTargetLid({ args, replyLid });
    const targetNumber = getMemberTargetNumber(targetLid);

    assertMemberTarget(targetLid, buildUsageMessage());

    if (!checkIfMemberIsMuted(remoteJid, targetLid)) {
      throw new WarningError("Este usuário não está silenciado!");
    }

    unmuteMember(remoteJid, targetLid);

    await sendSuccessReply(
      `@${targetNumber} foi desmutado com sucesso neste grupo!`,
      [targetLid],
    );
  },
};
