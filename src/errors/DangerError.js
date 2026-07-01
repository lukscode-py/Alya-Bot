import AppError from "./AppError.js";

export default class DangerError extends AppError {
  constructor(message) {
    super(message, "DangerError");
  }
}
