import { PREFIX } from "../../config.js";
import { checkIfMemberIsMuted, muteMember } from "../../utils/database.js";
import {
  assertGroupCommand,
  assertMemberTarget,
  assertMutableTarget,
  assertTargetCanBeMuted,
  getMemberTargetNumber,
  resolveMemberTargetLid,
} from "../../utils/admin-command-utils.js";

function buildUsageMessage() {
  return `Você precisa mencionar um usuário ou responder à mensagem do usuário que deseja mutar.

Exemplo: ${PREFIX}mute @fulano`;
}

export default {
  name: "mute",
  description:
    "Silencia um usuário no grupo e apaga as mensagens novas desse membro.",
  commands: ["mute", "mutar"],
  usage: `${PREFIX}mute @usuario ou responda à mensagem do usuário que deseja mutar`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({
    args,
    remoteJid,
    replyLid,
    sendErrorReply,
    sendSuccessReply,
    getGroupMetadata,
    isGroup,
  }) => {
    assertGroupCommand(isGroup);

    const targetLid = resolveMemberTargetLid({ args, replyLid });
    const targetNumber = getMemberTargetNumber(targetLid);

    assertMemberTarget(targetLid, buildUsageMessage());
    assertMutableTarget(targetLid);

    const groupMetadata = await getGroupMetadata();
    const targetStatus = assertTargetCanBeMuted({ groupMetadata, targetLid });

    if (!targetStatus.ok) {
      return sendErrorReply(
        `O usuário @${targetNumber} não está neste grupo.`,
        [targetLid],
      );
    }

    if (checkIfMemberIsMuted(remoteJid, targetLid)) {
      return sendErrorReply(
        `O usuário @${targetNumber} já está silenciado neste grupo.`,
        [targetLid],
      );
    }

    muteMember(remoteJid, targetLid);

    await sendSuccessReply(
      `@${targetNumber} foi mutado com sucesso neste grupo!`,
      [targetLid],
    );
  },
};
