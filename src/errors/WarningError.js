import AppError from "./AppError.js";

export default class WarningError extends AppError {
  constructor(message) {
    super(message, "WarningError");
  }
}
