export class NotationError extends Error {
  constructor(message, position = null) {
    super(message);
    this.name = 'NotationError';
    this.code = 'NOTATION_ERROR';
    this.position = position;
  }
}

export class TimeSignatureError extends NotationError {
  constructor(message, position = null) {
    super(message, position);
    this.name = 'TimeSignatureError';
    this.code = 'TIME_SIGNATURE_ERROR';
  }
}

export class MeasureError extends NotationError {
  constructor(message, position = null) {
    super(message, position);
    this.name = 'MeasureError';
    this.code = 'MEASURE_ERROR';
  }
}
