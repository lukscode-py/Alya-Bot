/**
 * Modelo base para criar novos comandos da Alya.
 *
 * Copie este arquivo para uma das pastas:
 * - admin: comandos para administradores do grupo
 * - member: comandos para membros em geral
 * - owner: comandos restritos ao dono do bot
 *
 * As propriedades disponíveis no handle estão documentadas em:
 * src/@types/index.d.ts
 */
import { PREFIX } from "../../config.js";

export default {
  name: "comando",
  description: "Descrição do comando",
  commands: ["comando1", "comando2"],
  usage: `${PREFIX}comando`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({}) => {
    // Implemente a lógica do comando aqui.
  },
};
