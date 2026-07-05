import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const configSource = fs.readFileSync("src/config.js", "utf8");
const commandSource = fs.readFileSync("src/commands/member/removebg.js", "utf8");
const serviceSource = fs.readFileSync("src/services/rmbg/local-rmbg.js", "utf8");
const scriptSource = fs.readFileSync("src/scripts/rmbg_tflite.py", "utf8");
const gitignoreSource = fs.readFileSync(".gitignore", "utf8");

describe("Local RMBG runtime", () => {
  it("defines local RMBG config with automatic runtime and model preparation", () => {
    assert.match(configSource, /export const RMBG_CONFIG/);
    assert.match(configSource, /enabled:\s*true/);
    assert.match(configSource, /provider:\s*"local-tflite"/);
    assert.match(configSource, /autoPrepare:\s*true/);
    assert.match(configSource, /autoInstallRuntime:\s*true/);
    assert.match(configSource, /autoDownloadModel:\s*true/);
    assert.match(configSource, /u2net_fp16_rmbg\.tflite/);
    assert.match(configSource, /models_ai\/raw\/refs\/heads\/main\/u2net_fp16_rmbg\.tflite/);
  });

  it("keeps RMBG model and Python runtime out of git", () => {
    assert.match(gitignoreSource, /assets\/ai\/models\//);
    assert.match(gitignoreSource, /assets\/ai\/runtime\//);
  });

  it("removebg command uses local RMBG service instead of external API", () => {
    assert.match(commandSource, /removeBackgroundLocal/);
    assert.doesNotMatch(commandSource, /alya-external-api/);
    assert.doesNotMatch(commandSource, /removeBg\(/);
  });

  it("local service prepares Termux, Windows and Linux runtime paths", () => {
    assert.match(serviceSource, /pkg update -y/);
    assert.match(serviceSource, /winget/);
    assert.match(serviceSource, /apt-get/);
    assert.match(serviceSource, /python3/);
    assert.match(serviceSource, /python/);
    assert.match(serviceSource, /py/);
  });

  it("local service downloads the RMBG model automatically", () => {
    assert.match(serviceSource, /axios\.get\(RMBG_CONFIG\.model\.url/);
    assert.match(serviceSource, /autoDownloadModel/);
    assert.match(serviceSource, /pipeline/);
  });

  it("Python helper supports common TFLite and TensorFlow runtimes", () => {
    assert.match(scriptSource, /tflite_runtime\.interpreter/);
    assert.match(scriptSource, /ai_edge_litert\.interpreter/);
    assert.match(scriptSource, /tensorflow\.lite/);
    assert.match(scriptSource, /putalpha/);
  });
});
