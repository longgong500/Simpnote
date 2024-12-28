/**
 * Lexical analyzer for ABC notation format
 * Handles parsing of:
 * - Title (T:)
 * - Key signature (K:)
 * - Voice/track ([V:])
 * - Lyrics (w:)
 * - Notes and barlines
 */
export class ABCLexicalAnalyzer {
  static TOKEN_TYPES = {
    TITLE: /^T:\s*(.+)/,
    KEY_SIGNATURE: /^K:\s*([A-G])/,
    VOICE: /^\[V:\s*(\d+)\s*\]/,
    LYRICS: /^w:\s*(.+)/,
    NOTE: /^[A-G][b#]?(?:\d+|\/*)?/,
    BARLINE: /^\|/,
    WHITESPACE: /^\s+/,
    INVALID_LYRICS: /^words?:\s*(.+)/,
    ERROR: /^[^ \n]+/
  };

  constructor() {
    this.tokens = [];
    this.currentLine = 1;
  }

  tokenize(input) {
    this.tokens = [];
    const lines = input.split('\n');

    for (const line of lines) {
      if (line.trim() === '') {
        this.currentLine++;
        continue;
      }

      let remaining = line.trim();
      let isValidLine = false;

      // Special handling for lyrics-like format errors
      if (remaining.match(ABCLexicalAnalyzer.TOKEN_TYPES.INVALID_LYRICS)) {
        this.tokens.push({
          type: 'INVALID_LYRICS',
          value: remaining,
          line: this.currentLine
        });
        this.currentLine++;
        continue;
      }

      // Check if line starts with any valid token pattern
      for (const [type, pattern] of Object.entries(ABCLexicalAnalyzer.TOKEN_TYPES)) {
        if (type !== 'ERROR' && type !== 'INVALID_LYRICS' && pattern.test(remaining)) {
          isValidLine = true;
          break;
        }
      }

      // If line doesn't start with any valid pattern, treat entire line as error
      if (!isValidLine) {
        this.tokens.push({
          type: 'ERROR',
          value: remaining,
          line: this.currentLine
        });
      } else {
        while (remaining.length > 0) {
          const token = this.nextToken(remaining);
          if (!token) break;

          if (token.type !== 'WHITESPACE') {
            const value = token.match[1] || token.match[0];
            this.tokens.push({
              type: token.type,
              value: value.trim(),
              line: this.currentLine
            });
          }

          remaining = remaining.slice(token.match[0].length).trim();
        }
      }
      this.currentLine++;
    }

    return this.tokens;
  }

  nextToken(input) {
    for (const [type, pattern] of Object.entries(ABCLexicalAnalyzer.TOKEN_TYPES)) {
      const match = input.match(pattern);
      if (match) {
        // For tokens with capture groups (TITLE, KEY_SIGNATURE, VOICE, LYRICS),
        // use the captured value, otherwise use the full match
        const value = (type === 'TITLE' || type === 'KEY_SIGNATURE' ||
                      type === 'VOICE' || type === 'LYRICS') ? match[1] : match[0];
        return {
          type,
          value: value.trim(),
          match
        };
      }
    }
    return null;
  }
}
