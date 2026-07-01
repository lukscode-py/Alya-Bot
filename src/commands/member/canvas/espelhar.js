import { createFfmpegImageCommand } from "../../../utils/canvas-command-utils.js";

export default createFfmpegImageCommand({
  name: "espelhar",
  description: "Espelha a imagem enviada.",
  commands: ["espelhar", "muda-direcao", "mudar-direcao", "mirror"],
  effectMethod: "mirrorImage",
  effectErrorMessage: "Erro ao aplicar efeito de espelhamento",
});
