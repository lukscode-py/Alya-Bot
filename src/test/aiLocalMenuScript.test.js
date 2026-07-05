import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const menuSource = fs.readFileSync("ai-local-menu.sh", "utf8");

describe("Interactive local AI Bash menu", () => {
  it("delegates actions to the Node local AI CLI", () => {
    assert.match(menuSource, /src\/scripts\/ai-local\.js/);
    assert.match(menuSource, /run_cli status/);
    assert.match(menuSource, /run_cli install/);
    assert.match(menuSource, /run_cli serve/);
    assert.match(menuSource, /run_cli pull "\$model"/);
    assert.match(menuSource, /run_cli delete "\$model"/);
    assert.match(menuSource, /run_cli run "\$prompt"/);
  });

  it("offers an interactive menu for common Ollama tasks", () => {
    assert.match(menuSource, /Status do Ollama\/local/);
    assert.match(menuSource, /Baixar modelo/);
    assert.match(menuSource, /Apagar modelo/);
    assert.match(menuSource, /Testar prompt na IA local/);
    assert.match(menuSource, /Preparar ambiente default/);
  });

  it("asks for confirmation before deleting a model", () => {
    assert.match(menuSource, /confirm_action/);
    assert.match(menuSource, /Tem certeza que deseja apagar o modelo/);
  });
});
