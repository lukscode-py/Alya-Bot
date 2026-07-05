import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const configSource = fs.readFileSync("src/config.js", "utf8");

describe("Termux default AI config", () => {
  it("uses local AI as the default provider", () => {
    assert.match(configSource, /defaultProvider:\s*"local"/);
    assert.match(configSource, /activeProviders:\s*\[\s*"local"/);
  });

  it("keeps the light Ollama model as the default local model", () => {
    assert.match(configSource, /selectedModel:\s*"qwen2\.5:0\.5b"/);
    assert.match(configSource, /provider:\s*"ollama"/);
    assert.match(configSource, /autoStartServer:\s*true/);
  });

  it("uses a lightweight Termux performance profile", () => {
    assert.match(configSource, /threads:\s*2/);
    assert.match(configSource, /contextSize:\s*1024/);
    assert.match(configSource, /maxTokens:\s*256/);
    assert.match(configSource, /gpuLayers:\s*0/);
    assert.match(configSource, /timeout:\s*180000/);
  });

  it("keeps model download interactive by default", () => {
    assert.match(configSource, /autoDownloadModel:\s*false/);
    assert.match(configSource, /askBeforeDownload:\s*true/);
  });

  it("enables API provider commands without hardcoding keys", () => {
    assert.match(configSource, /openrouter:\s*{[\s\S]*enabled:\s*true/);
    assert.match(configSource, /apiKeys:\s*\[readEnv\("OPENROUTER_API_KEY"\)\]/);
    assert.match(configSource, /openaiCompatible:\s*{[\s\S]*enabled:\s*true/);
    assert.match(configSource, /apiKeys:\s*\[readEnv\("ALYA_OPENAI_COMPATIBLE_API_KEY"\)\]/);
  });
});
