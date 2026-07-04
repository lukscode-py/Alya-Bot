import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const bashSource = fs.readFileSync("prepare-ai-ambiente.sh", "utf8");
const nodeSource = fs.readFileSync("src/scripts/prepare-ai-environment.js", "utf8");

describe("AI environment preparation script", () => {
  it("root bash script runs the node preparation script", () => {
    assert.match(bashSource, /src\/scripts\/prepare-ai-environment\.js/);
    assert.match(bashSource, /set -euo pipefail/);
  });

  it("node script prepares local provider without WhatsApp connection", () => {
    assert.match(nodeSource, /prepareLocalProvider/);
    assert.match(nodeSource, /interactive:\s*false/);
    assert.match(nodeSource, /autoInstallRuntime:\s*true/);
    assert.match(nodeSource, /autoDownloadModel:\s*true/);
    assert.match(nodeSource, /autoStartServer:\s*true/);
    assert.doesNotMatch(nodeSource, /connect\(/);
  });

  it("node script forces local provider in memory only", () => {
    assert.match(nodeSource, /aiService\.loadRuntimeData/);
    assert.match(nodeSource, /activeProviders\.push\("local"\)/);
    assert.match(nodeSource, /enabled:\s*true/);
  });
});
