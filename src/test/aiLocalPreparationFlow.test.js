import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const runtimeSource = fs.readFileSync("src/services/ai/local-runtime.js", "utf8");
const serviceSource = fs.readFileSync("src/services/ai/index.js", "utf8");
const providerSource = fs.readFileSync("src/services/ai/providers/local-llama.js", "utf8");

describe("Local AI preparation flow", () => {
  it("validates runtime by executing llama before considering it ready", () => {
    assert.match(runtimeSource, /canExecuteRuntime/);
    assert.match(runtimeSource, /--help/);
    assert.match(runtimeSource, /getLocalRuntimeStatus/);
  });

  it("prints explicit preparation and download logs before connection", () => {
    assert.match(serviceSource, /Verificando ambiente antes da conexão/);
    assert.match(serviceSource, /Runtime validado/);
    assert.match(serviceSource, /Modelo selecionado/);
    assert.match(serviceSource, /Modelo .* não instalado/);
    assert.match(runtimeSource, /Baixando modelo/);
    assert.match(runtimeSource, /Destino:/);
  });

  it("local provider awaits async runtime status before request", () => {
    assert.match(providerSource, /await getLocalRuntimeStatus/);
  });
});
