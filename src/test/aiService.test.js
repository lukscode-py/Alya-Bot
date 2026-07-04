import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createAiService } from "../services/ai/index.js";
import { buildAiPaths } from "../services/ai/paths.js";

function createTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "alya-ai-service-"));
}

describe("AI Service", () => {
  it("returns controlled error when service is disabled", async () => {
    const service = createAiService({
      rootDir: createTempRoot(),
      config: {
        ai: {
          enabled: false,
        },
      },
    });

    const result = await service.request({
      messages: [{ role: "user", content: "Olá" }],
    });

    assert.equal(result.ok, false);
    assert.equal(result.error, "AI_SERVICE_DISABLED");
  });

  it("rotates to next key and does not save raw api keys", async () => {
    const rootDir = createTempRoot();

    const service = createAiService({
      rootDir,
      config: {
        ai: {
          enabled: true,
          defaultProvider: "openaiCompatible",
          fallbackProviders: [],
          activeProviders: ["openaiCompatible"],
        },
        providers: {
          openaiCompatible: {
            enabled: true,
            kind: "openaiCompatible",
            baseURL: "https://example.test/v1",
            defaultModel: "teste-modelo",
            allowedModels: ["teste-modelo"],
            apiKeys: ["bad-key", "good-key"],
            timeout: 1000,
            cooldownMs: 1000,
          },
        },
      },
      adapters: {
        openaiCompatible: async ({ apiKey }) => {
          if (apiKey === "bad-key") {
            const error = new Error("Unauthorized");
            error.response = { status: 401 };
            throw error;
          }

          return {
            text: "OK",
            data: { ok: true },
          };
        },
      },
    });

    const result = await service.request({
      provider: "openaiCompatible",
      allowProviderFallback: false,
      messages: [{ role: "user", content: "Olá" }],
    });

    assert.equal(result.ok, true);
    assert.equal(result.text, "OK");

    const statePath = buildAiPaths(rootDir).statePath;
    const stateRaw = fs.readFileSync(statePath, "utf8");

    assert.equal(stateRaw.includes("bad-key"), false);
    assert.equal(stateRaw.includes("good-key"), false);
  });
});
