export const AI_ERROR_CODES = Object.freeze({
  AI_SERVICE_DISABLED: "AI_SERVICE_DISABLED",
  AI_PROVIDER_DISABLED: "AI_PROVIDER_DISABLED",
  AI_PROVIDER_NOT_FOUND: "AI_PROVIDER_NOT_FOUND",
  AI_MODEL_NOT_FOUND: "AI_MODEL_NOT_FOUND",
  AI_MODEL_NOT_INSTALLED: "AI_MODEL_NOT_INSTALLED",
  AI_NO_VALID_API_KEY: "AI_NO_VALID_API_KEY",
  AI_API_KEY_LIMITED: "AI_API_KEY_LIMITED",
  AI_API_KEY_INVALID: "AI_API_KEY_INVALID",
  AI_PROVIDER_TIMEOUT: "AI_PROVIDER_TIMEOUT",
  AI_PROVIDER_REQUEST_FAILED: "AI_PROVIDER_REQUEST_FAILED",
  AI_LOCAL_RUNTIME_NOT_FOUND: "AI_LOCAL_RUNTIME_NOT_FOUND",
  AI_LOCAL_MODEL_DOWNLOAD_FAILED: "AI_LOCAL_MODEL_DOWNLOAD_FAILED",
  AI_LOCAL_MODEL_LOAD_FAILED: "AI_LOCAL_MODEL_LOAD_FAILED",
});

export class AiServiceError extends Error {
  constructor(error, message, details = {}) {
    super(message);
    this.name = "AiServiceError";
    this.error = error;
    this.provider = details.provider;
    this.model = details.model;
    this.status = details.status;
    this.retryable = Boolean(details.retryable);
    this.details = details.details;
  }

  toJSON() {
    return buildAiErrorObject(this);
  }
}

export function buildAiErrorObject(error) {
  if (error instanceof AiServiceError) {
    return {
      ok: false,
      error: error.error,
      provider: error.provider,
      model: error.model,
      message: error.message,
      status: error.status,
      retryable: error.retryable,
      details: error.details,
    };
  }

  return {
    ok: false,
    error: AI_ERROR_CODES.AI_PROVIDER_REQUEST_FAILED,
    message: error?.message || "Erro desconhecido no serviço de IA.",
  };
}

export function createAiError(error, message, details = {}) {
  return new AiServiceError(error, message, details);
}
