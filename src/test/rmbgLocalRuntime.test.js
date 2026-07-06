import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const configSource = fs.readFileSync("src/config.js", "utf8");
const indexSource = fs.readFileSync("src/index.js", "utf8");
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
    assert.match(configSource, /autoInstallRuntime:\s*false/);
    assert.match(configSource, /autoDownloadModel:\s*false/);
    assert.match(configSource, /askBeforePrepare:\s*true/);
    assert.match(configSource, /askBeforeDownload:\s*true/);
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
    assert.match(serviceSource, /showOutput:\s*true/);
    assert.match(serviceSource, /stdio:\s*showOutput \? "inherit" : "pipe"/);
  });

  it("local service downloads the RMBG model automatically", () => {
    assert.match(serviceSource, /axios\.get\(RMBG_CONFIG\.model\.url/);
    assert.match(serviceSource, /autoDownloadModel/);
    assert.match(serviceSource, /pipeline/);
    assert.match(serviceSource, /content-length/);
    assert.match(serviceSource, /Download do modelo/);
  });

  it("prepares RMBG during bot startup and asks before setup/download", () => {
    assert.match(indexSource, /prepareLocalRmbgStartup/);
    assert.match(indexSource, /await prepareLocalRmbgStartup\(\)/);
    assert.match(serviceSource, /export async function prepareLocalRmbgStartup/);
    assert.match(serviceSource, /askYesNo/);
    assert.match(serviceSource, /Deseja preparar o ambiente agora/);
    assert.match(serviceSource, /Deseja baixar o modelo agora/);
    assert.match(serviceSource, /disableRmbgForCurrentRun/);
  });

  it("Python helper supports common TFLite and TensorFlow runtimes", () => {
    assert.match(scriptSource, /tflite_runtime\.interpreter/);
    assert.match(scriptSource, /ai_edge_litert\.interpreter/);
    assert.match(scriptSource, /tensorflow\.lite/);
    assert.match(scriptSource, /putalpha/);
  });
});
