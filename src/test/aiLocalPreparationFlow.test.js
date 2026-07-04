import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");
const serviceSource = fs.readFileSync("src/services/ai/index.js", "utf8");
const providerSource = fs.readFileSync("src/services/ai/providers/local-ollama.js", "utf8");

describe("Local AI preparation flow", () => {
  it("validates Ollama runtime before considering it ready", () => {
    assert.match(runtimeSource, /--version/);
    assert.match(runtimeSource, /getLocalRuntimeStatus/);
  });

  it("prints explicit Ollama preparation and download logs before connection", () => {
    assert.match(serviceSource, /Verificando ambiente antes da conexão/);
    assert.match(serviceSource, /Runtime Ollama validado/);
    assert.match(serviceSource, /Modelo selecionado/);
    assert.match(serviceSource, /Modelo .* não instalado/);
    assert.match(runtimeSource, /Baixando modelo Ollama/);
    assert.match(runtimeSource, /ollama serve/);
  });

  it("local provider ensures Ollama server before request", () => {
    assert.match(providerSource, /await ensureOllamaServer/);
  });
});
