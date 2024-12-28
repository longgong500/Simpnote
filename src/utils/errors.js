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

export const ABC_ERRORS = {
  INVALID_TITLE_FORMAT: 'Invalid title format, must start with "T:"',
  MISSING_TITLE: 'Missing title, please add a line starting with "T:"',
  INVALID_KEY_FORMAT: 'Invalid key signature format, must start with "K:" followed by a valid key (e.g., F, C, G)',
  MISSING_KEY: 'Missing key signature, please add a line starting with "K:"',
  UNSUPPORTED_KEY: 'Unsupported key signature, please use a valid major key (C, G, D, A, E, B, F)',
  INVALID_VOICE_FORMAT: 'Invalid voice format, must be in format "[V: number]"',
  MISSING_VOICE: 'Missing voice marker, please add a voice marker (e.g., [V: 1])',
  INVALID_VOICE_NUMBER: 'Invalid voice number, please use a positive integer',
  INVALID_NOTE: 'Invalid note, please use valid notes (A-G)',
  INVALID_DURATION: 'Invalid note duration',
  INVALID_BARLINE: 'Invalid barline, please use "|" as measure separator',
  INVALID_LYRICS_FORMAT: 'Invalid lyrics format, must start with "w:"',
  LYRICS_NOTE_MISMATCH: 'Number of lyrics does not match number of notes',
  PARSE_ERROR: 'Error parsing the score',
  INVALID_LINE: 'Invalid input line',
  EMPTY_INPUT: 'Input cannot be empty'
};

export class ABCNotationError extends NotationError {
  constructor(type, line = null) {
    const message = ABC_ERRORS[type] || '未知错误';
    super(message, line);
    this.name = 'ABCNotationError';
    this.code = 'ABC_NOTATION_ERROR';
    this.type = type;
    this.line = line;
  }
}
