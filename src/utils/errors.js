export class NotationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotationError';
  }
}
