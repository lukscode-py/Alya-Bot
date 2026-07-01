export default class AppError extends Error {
  constructor(message, name) {
    super(message);

    this.name = name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
