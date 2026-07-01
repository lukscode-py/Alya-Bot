import { createFfmpegImageCommand } from "../../../utils/canvas-command-utils.js";

export default createFfmpegImageCommand({
  name: "pixel",
  description: "Converte a imagem enviada para pixel-art.",
  commands: ["pixel", "pixel-art", "px"],
  effectMethod: "applyPixelation",
  effectErrorMessage: "Erro ao aplicar efeito pixel",
});
