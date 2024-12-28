/**
 * Parser for ABC notation format
 * Processes tokens from ABCLexicalAnalyzer into musical data structures
 */
import { ABCLexicalAnalyzer } from './abcLexicalAnalyzer';
import { ABCNotationError, ABC_ERRORS } from './errors';

export class ABCNotationParser {
  constructor() {
    this.lexer = new ABCLexicalAnalyzer();
    this.reset();
  }

  reset() {
    this.title = '';
    this.keySignature = '';
    this.currentVoice = '1';
    this.notes = [];
    this.lyrics = [];
  }

  parse(input) {
    this.reset();
    const tokens = this.lexer.tokenize(input);

    // First pass: collect tokens by type
    const titleTokens = [];
    const keyTokens = [];
    const voiceTokens = [];
    const noteTokens = [];
    const barlineTokens = [];
    const lyricsTokens = [];

    tokens.forEach(token => {
      switch (token.type) {
        case 'TITLE':
          titleTokens.push(token);
          break;
        case 'KEY_SIGNATURE':
          keyTokens.push(token);
          break;
        case 'VOICE':
          voiceTokens.push(token);
          break;
        case 'NOTE':
          noteTokens.push(token);
          break;
        case 'BARLINE':
          barlineTokens.push(token);
          break;
        case 'LYRICS':
          lyricsTokens.push(token);
          break;
        case 'INVALID_LYRICS':
          throw new ABCNotationError('INVALID_LYRICS_FORMAT');
        case 'ERROR':
          // Check for specific invalid formats
          if (token.value.startsWith('Title:')) {
            throw new ABCNotationError('INVALID_TITLE_FORMAT');
          }
          if (token.value.startsWith('[Voice:')) {
            throw new ABCNotationError('INVALID_VOICE_FORMAT');
          }
          if (token.value.startsWith('K:') && !/^K:\s*[A-G]$/.test(token.value)) {
            throw new ABCNotationError('UNSUPPORTED_KEY');
          }
          throw new ABCNotationError('INVALID_LINE');
      }
    });

    // Check for title
    if (titleTokens.length === 0) {
      throw new ABCNotationError('MISSING_TITLE');
    }
    titleTokens.forEach(token => this.parseTitle(token));

    // Only check for key signature if we have notes or lyrics
    if ((noteTokens.length > 0 || lyricsTokens.length > 0) && keyTokens.length === 0) {
      throw new ABCNotationError('MISSING_KEY');
    }

    // Process key signature if present
    if (keyTokens.length > 0) {
      keyTokens.forEach(token => this.parseKeySignature(token));
    }

    // Process voice if present
    if (voiceTokens.length > 0) {
      voiceTokens.forEach(token => this.parseVoice(token));
    }

    // Process notes, ignoring barlines
    noteTokens.forEach(token => {
      this.parseNote(token);
    });

    // Process lyrics if present
    if (lyricsTokens.length > 0) {
      lyricsTokens.forEach(token => this.parseLyrics(token));
    }

    return {
      title: this.title,
      keySignature: this.keySignature,
      voice: this.currentVoice,
      notes: this.notes,
      lyrics: this.lyrics
    };
  }

  parseTitle(token) {
    const value = token.value;
    if (!value || typeof value !== 'string') {
      throw new ABCNotationError('INVALID_TITLE_FORMAT');
    }
    this.title = value;
  }

  parseKeySignature(token) {
    const key = token.value;
    if (!['C', 'G', 'D', 'A', 'E', 'B', 'F'].includes(key)) {
      throw new ABCNotationError('UNSUPPORTED_KEY');
    }
    this.keySignature = key;
  }

  parseVoice(token) {
    const match = token.value.match(/^(\d+)$/);
    if (!match) {
      throw new ABCNotationError('INVALID_VOICE_FORMAT');
    }
    const voiceNum = parseInt(match[1], 10);
    if (isNaN(voiceNum) || voiceNum < 1) {
      throw new ABCNotationError('INVALID_VOICE_FORMAT');
    }
    this.currentVoice = match[1]; // Store as string to match test expectations
  }

  parseNote(token) {
    const match = token.value.match(/^([A-G][b#]?)(?:(\d+|\/*)?)?$/);
    if (!match) {
      throw new ABCNotationError('INVALID_NOTE');
    }
    const [_, pitch, duration] = match;
    this.notes.push({
      pitch,
      duration: duration || '1/4'
    });
  }

  parseBarline(token) {
    if (token.value !== '|') {
      throw new ABCNotationError('INVALID_BARLINE');
    }
    this.notes.push({ type: 'barline' });
  }

  parseLyrics(token) {
    const lyrics = token.value;
    // Split Chinese characters into array
    this.lyrics = Array.from(lyrics);
    if (this.lyrics.length !== this.notes.length) {
      throw new ABCNotationError('LYRICS_NOTE_MISMATCH');
    }
  }
}
