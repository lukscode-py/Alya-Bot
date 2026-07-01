import { createFfmpegImageCommand } from "../../../utils/canvas-command-utils.js";

export default createFfmpegImageCommand({
  name: "gray",
  description: "Converte a imagem enviada para preto e branco.",
  commands: ["gray", "preto-e-branco", "pb"],
  effectMethod: "convertToGrayscale",
  effectErrorMessage: "Erro ao aplicar efeito preto e branco",
});
