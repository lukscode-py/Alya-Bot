import { readJsonFile, writeJsonFile } from "./config.js";

export class AiProviderState {
  constructor(paths) {
    this.paths = paths;
    this.state = {};
  }

  load() {
    this.state = readJsonFile(this.paths.statePath, {});
    return this.state;
  }

  save() {
    writeJsonFile(this.paths.statePath, this.state);
  }

  getProviderState(providerName) {
    if (!this.state[providerName]) {
      this.state[providerName] = {
        lastWorkingKeyHash: null,
        keys: [],
      };
    }

    return this.state[providerName];
  }

  getKeyState(providerName, keyHash) {
    const providerState = this.getProviderState(providerName);
    let keyState = providerState.keys.find((item) => item.hash === keyHash);

    if (!keyState) {
      keyState = {
        hash: keyHash,
        status: "unknown",
        lastSuccessAt: null,
        lastErrorAt: null,
        errorCount: 0,
        cooldownUntil: null,
      };

      providerState.keys.push(keyState);
    }

    return keyState;
  }

  markSuccess(providerName, keyHash) {
    const providerState = this.getProviderState(providerName);
    const keyState = this.getKeyState(providerName, keyHash);
    const now = new Date().toISOString();

    keyState.status = "working";
    keyState.lastSuccessAt = now;
    keyState.lastErrorAt = null;
    keyState.errorCount = 0;
    keyState.cooldownUntil = null;
    providerState.lastWorkingKeyHash = keyHash;

    this.save();
  }

  markFailure(providerName, keyHash, classification, providerCooldownMs = null) {
    const keyState = this.getKeyState(providerName, keyHash);
    const now = new Date();
    const cooldownMs =
      classification.cooldownMs === null
        ? null
        : providerCooldownMs || classification.cooldownMs || 300000;

    keyState.status = classification.keyStatus;
    keyState.lastErrorAt = now.toISOString();
    keyState.errorCount = Number(keyState.errorCount || 0) + 1;
    keyState.cooldownUntil =
      cooldownMs === null ? null : new Date(now.getTime() + cooldownMs).toISOString();

    this.save();
  }
}
