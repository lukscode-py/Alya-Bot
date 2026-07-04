import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const serviceSource = fs.readFileSync("src/services/ai/index.js", "utf8");
const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");
const providerSource = fs.readFileSync("src/services/ai/providers/local-ollama.js", "utf8");
const registrySource = fs.readFileSync("database/ai/models-registry.json", "utf8");

describe("Local AI startup preparation", () => {
  it("initialization prepares or disables local provider before use", () => {
    assert.match(serviceSource, /prepareLocalProvider/);
    assert.match(serviceSource, /disableLocalProvider/);
    assert.match(serviceSource, /Deseja preparar o ambiente agora/);
    assert.match(serviceSource, /Deseja instalar o modelo agora/);
  });

  it("local runtime supports no-compile installers and resolved runtime path", () => {
    assert.match(runtimeSource, /installLocalRuntime/);
    assert.match(runtimeSource, /ollama/);
    assert.match(runtimeSource, /tur-repo/);
    assert.match(runtimeSource, /install\.sh/);
    assert.match(runtimeSource, /getLocalRuntimeStatus/);
    assert.match(providerSource, /ensureOllamaServer/);
  });

  it("registry includes the default qwen Ollama local test model", () => {
    assert.match(registrySource, /qwen2\.5:0\.5b/);
    assert.match(registrySource, /ollamaModel/);
    assert.match(registrySource, /"provider": "ollama"/);
  });
});
