import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");
const serviceSource = fs.readFileSync("src/services/ai/index.js", "utf8");
const configSource = fs.readFileSync("src/config.js", "utf8");

describe("Local AI non-interactive setup", () => {
  it("explains when a yes/no prompt cannot run without a TTY", () => {
    assert.match(runtimeSource, /Terminal não interativo detectado/);
    assert.match(runtimeSource, /Não é possível responder s\/n aqui/);
  });

  it("passes logger to local setup prompts", () => {
    assert.match(serviceSource, /onLog: warningLog/);
  });

  it("documents auto setup flags in bot config", () => {
    assert.match(configSource, /autoInstallRuntime/);
    assert.match(configSource, /autoDownloadModel/);
    assert.match(configSource, /terminal não interativo|ambientes sem terminal interativo/i);
  });
});
