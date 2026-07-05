import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const serviceSource = fs.readFileSync("src/services/ai/index.js", "utf8");
const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");
const providerSource = fs.readFileSync("src/services/ai/providers/local-ollama.js", "utf8");
const cliSource = fs.readFileSync("src/scripts/ai-local.js", "utf8");
const configSource = fs.readFileSync("src/config.js", "utf8");
const registrySource = fs.readFileSync("database/ai/models-registry.json", "utf8");

describe("Local AI Ollama provider", () => {
  it("uses Ollama as the local provider adapter", () => {
    assert.match(serviceSource, /requestLocalOllama/);
    assert.match(providerSource, /\/api\/chat/);
    assert.match(providerSource, /ensureOllamaServer/);
    assert.doesNotMatch(serviceSource, /requestLocalLlama/);
  });

  it("can install, start, pull, list and delete models through the local CLI", () => {
    assert.match(cliSource, /src\/scripts\/ai-local\.js pull/);
    assert.match(cliSource, /delete <modelo>/);
    assert.match(cliSource, /ensureOllamaServer/);
    assert.match(cliSource, /ensureOllamaModel/);
    assert.match(cliSource, /deleteOllamaModel/);
  });

  it("documents automatic Ollama installation for Termux, Linux and Windows", () => {
    assert.match(runtimeSource, /pkg install.*ollama/s);
    assert.match(runtimeSource, /curl -fsSL https:\/\/ollama\.com\/install\.sh \| sh/);
    assert.match(runtimeSource, /install\.ps1/);
  });

  it("configures local defaults for Ollama", () => {
    assert.match(configSource, /provider:\s*"ollama"/);
    assert.match(configSource, /selectedModel:\s*"[a-z0-9][^"]*:[^"]+"/i);
    assert.match(configSource, /autoStartServer:\s*true/);
    assert.match(configSource, /baseUrl:\s*"http:\/\/127\.0\.0\.1:11434"/);
  });

  it("registry contains Ollama model names instead of GGUF paths", () => {
    assert.match(registrySource, /"provider": "ollama"/);
    assert.match(registrySource, /"ollamaModel": "qwen2\.5:0\.5b"/);
    assert.doesNotMatch(registrySource, /gguf/i);
  });
});
