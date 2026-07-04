import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const instructionsSource = fs.readFileSync("src/services/ai/local-instructions.js", "utf8");
const prepareScriptSource = fs.readFileSync("src/scripts/prepare-ai-environment.js", "utf8");
const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");

describe("Local AI manual runtime instructions", () => {
  it("instructs Termux users to install llama.cpp with pkg", () => {
    assert.match(instructionsSource, /pkg update/);
    assert.match(instructionsSource, /pkg install -y llama-cpp/);
  });

  it("instructs desktop users to download compiled releases", () => {
    assert.match(instructionsSource, /github\.com\/ggml-org\/llama\.cpp\/releases/);
    assert.match(instructionsSource, /Ubuntu x64 \(CPU\)/);
    assert.match(instructionsSource, /Windows x64 \(CPU\)/);
    assert.match(instructionsSource, /runtimePath/);
  });

  it("prepare script prints instructions when runtime preparation fails", () => {
    assert.match(prepareScriptSource, /getLocalRuntimeManualInstructions/);
    assert.match(prepareScriptSource, /runtime-install-failed/);
    assert.match(prepareScriptSource, /runtime-not-prepared/);
  });

  it("runtime errors point user back to manual instructions instead of pretending setup worked", () => {
    assert.match(runtimeSource, /baixar um binário compilado/);
    assert.match(runtimeSource, /local\.runtimePath/);
  });
});
