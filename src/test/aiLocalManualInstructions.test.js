import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const instructionsSource = fs.readFileSync("src/services/ai/local-instructions.js", "utf8");
const prepareScriptSource = fs.readFileSync("src/scripts/prepare-ai-environment.js", "utf8");
const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");

describe("Local AI manual runtime instructions", () => {
  it("instructs Termux users to install Ollama with pkg", () => {
    assert.match(instructionsSource, /pkg update/);
    assert.match(instructionsSource, /pkg install ollama -y/);
  });

  it("instructs desktop users to install Ollama", () => {
    assert.match(instructionsSource, /ollama\.com\/install\.sh/);
    assert.match(instructionsSource, /install\.ps1/);
    assert.match(instructionsSource, /ollama --version/);
  });

  it("prepare script prints instructions when runtime preparation fails", () => {
    assert.match(prepareScriptSource, /getLocalRuntimeManualInstructions/);
    assert.match(prepareScriptSource, /runtime-install-failed/);
    assert.match(prepareScriptSource, /runtime-not-prepared/);
  });

  it("runtime errors point user back to Ollama instructions instead of pretending setup worked", () => {
    assert.match(runtimeSource, /Ollama não encontrado/);
    assert.match(runtimeSource, /installHint/);
  });
});
