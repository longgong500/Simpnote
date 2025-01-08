/**
 * Parser for ABC notation format
 * Processes tokens from ABCLexicalAnalyzer into musical data structures
 */
import { ABCLexicalAnalyzer } from './abcLexicalAnalyzer';
import { ABCNotationError } from './errors';

export class ABCNotationParser {
  constructor() {
    this.lexer = new ABCLexicalAnalyzer();
    this.reset();
  }

  reset() {
    this.title = '';
    this.key = '';
    this.currentVoice = '1';
    this.notes = [];
    this.lyrics = [];
  }

  parse(input) {
    if (!input || typeof input !== 'string') {
      return { title: '', key: '', notes: [] };
    }

    this.reset();
    const lines = input.split('\n');
    const notes = [];
    let currentLyrics = [];

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      if (line.startsWith('T:')) {
        this.title = line.substring(2).trim();
      } else if (line.startsWith('K:')) {
        this.key = line.substring(2).trim();
      } else if (line.startsWith('w:')) {
        currentLyrics = line.substring(2).trim().split(/\s+/);
      } else {
        this.parseNoteLine(line, notes);
      }
    });

    if (currentLyrics.length > 0) {
      let lyricIndex = 0;
      notes.forEach(note => {
        if (note.type === 'note' && lyricIndex < currentLyrics.length) {
          note.text = currentLyrics[lyricIndex++];
        }
      });
    }

    return {
      title: this.title,
      key: this.key,
      notes
    };
  }

  parseNoteLine(line, notes, lyrics) {
    if (line.startsWith('T:') || line.startsWith('K:') || line.startsWith('w:')) {
      return;
    }

    const noteLine = line.replace(/^\[V:\s*\d+\]/, '').trim();
    if (!noteLine) return;

    const noteTokens = noteLine.split(/\s+/);
    noteTokens.forEach(token => {
      if (token === '|') {
        notes.push({ type: 'barline' });
      } else if (token) {
        const note = this.parseNote(token);
        if (note) {
          notes.push(note);
        }
      }
    });
  }

  parseNote(token) {
    if (!token || token === '|') return null;

    const noteMatch = token.match(/^([A-Ga-g])([,']*)?$/);
    if (!noteMatch) return null;

    const [_, note, octaveModifiers = ''] = noteMatch;
    const noteName = note.toLowerCase();

    // Calculate octave based on case and modifiers
    let octave = this.getOctave(note);

    // Adjust octave based on modifiers
    octaveModifiers.split('').forEach(mod => {
      if (mod === ',') octave--;
      if (mod === "'") octave++;
    });

    return {
      type: 'note',
      keys: [`${noteName}/${octave}`],
      duration: 'q'
    };
  }

  getOctave(note) {
    return note === note.toUpperCase() ? 3 : 4;
  }
}
