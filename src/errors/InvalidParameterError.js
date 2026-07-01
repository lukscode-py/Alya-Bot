import AppError from "./AppError.js";

export default class InvalidParameterError extends AppError {
  constructor(message) {
    super(message, "InvalidParameterError");
  }
}
