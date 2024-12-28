import { ABCNotationParser } from '../abcNotationParser';
import { ABC_ERRORS } from '../errors';

describe('ABCNotationParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ABCNotationParser();
  });

  describe('Title parsing', () => {
    test('parses valid title correctly', () => {
      const input = 'T: 小燕子';
      const result = parser.parse(input);
      expect(result.title).toBe('小燕子');
    });

    test('throws error on invalid title format', () => {
      const input = 'Title: 小燕子';
      expect(() => parser.parse(input)).toThrow(ABC_ERRORS.INVALID_TITLE_FORMAT);
    });
  });

  describe('Key signature parsing', () => {
    test('parses valid key signature correctly', () => {
      const input = `T: Test Title
K: F`;
      const result = parser.parse(input);
      expect(result.keySignature).toBe('F');
    });

    test('throws error on invalid key signature', () => {
      const input = `T: Test Title
K: H`;
      expect(() => parser.parse(input)).toThrow(ABC_ERRORS.UNSUPPORTED_KEY);
    });
  });

  describe('Voice parsing', () => {
    test('parses valid voice correctly', () => {
      const input = `T: Test Title
K: F
[V: 1]E G C A | G`;
      const result = parser.parse(input);
      expect(result.voice).toBe('1');
      expect(result.notes).toHaveLength(5);
    });

    test('throws error on invalid voice format', () => {
      const input = `T: Test Title
K: F
[Voice: 1]E G C A | G`;
      expect(() => parser.parse(input)).toThrow(ABC_ERRORS.INVALID_VOICE_FORMAT);
    });
  });

  describe('Lyrics parsing', () => {
    test('parses valid lyrics correctly', () => {
      const input = `T: Test Title
K: F
[V: 1]E G C A | G
w: 小燕子穿花`;
      const result = parser.parse(input);
      expect(result.lyrics).toEqual(['小', '燕', '子', '穿', '花']);
    });

    test('throws error on invalid lyrics format', () => {
      const input = `T: Test Title
K: F
[V: 1]E G C A | G
words: 小燕子穿花`;
      expect(() => parser.parse(input)).toThrow(ABC_ERRORS.INVALID_LYRICS_FORMAT);
    });
  });

  describe('Complete notation parsing', () => {
    test('parses complete valid notation correctly', () => {
      const input = `T: 小燕子
K: F
[V: 1]E G C A | G
w: 小燕子穿花`;
      const result = parser.parse(input);
      expect(result.title).toBe('小燕子');
      expect(result.keySignature).toBe('F');
      expect(result.voice).toBe('1');
      expect(result.notes).toHaveLength(5);
      expect(result.lyrics).toEqual(['小', '燕', '子', '穿', '花']);
    });

    test('throws error on missing required fields', () => {
      const input = `[V: 1]E G C A | G
w: 小燕子穿花`;
      expect(() => parser.parse(input)).toThrow(ABC_ERRORS.MISSING_TITLE);
    });

    test('throws error on lyrics-notes mismatch', () => {
      const input = `T: 小燕子
K: F
[V: 1]E G C | G
w: 小燕子穿花`;
      expect(() => parser.parse(input)).toThrow(ABC_ERRORS.LYRICS_NOTE_MISMATCH);
    });
  });
});
