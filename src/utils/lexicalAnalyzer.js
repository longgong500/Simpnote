export class LexicalAnalyzer {
  static TOKEN_TYPES = {
    TIME_SIGNATURE: /^L:[\s]*\d+\/\d+/,
    NOTE: /^[1-7]/,
    REST: /^z/,
    TIME_MODIFIER: /^\d+|^\//,
    BARLINE: /^\|/,
    ERROR: /^[^ \n]+/
  };

  tokenize(input) {
    if (!input || typeof input !== 'string') {
      return [];
    }

    const tokens = [];
    let remaining = input.trim();
    let position = 0;

    console.log('Starting tokenization of:', input);

    while (remaining.length > 0) {
      let matched = false;

      // Skip whitespace
      const whitespaceMatch = remaining.match(/^\s+/);
      if (whitespaceMatch) {
        const whitespace = whitespaceMatch[0];
        remaining = remaining.slice(whitespace.length);
        position += whitespace.length;
        continue;
      }

      // Try to match each token type
      for (const [type, pattern] of Object.entries(LexicalAnalyzer.TOKEN_TYPES)) {
        const match = remaining.match(pattern);
        if (match) {
          const token = {
            type,
            value: match[0],
            position
          };
          console.log('Found token:', token);
          tokens.push(token);
          remaining = remaining.slice(match[0].length);
          position += match[0].length;
          matched = true;
          break;
        }
      }

      // If no token type matched, treat as ERROR token
      if (!matched) {
        const errorMatch = remaining.match(/^[^ \n]+/);
        if (errorMatch) {
          const token = {
            type: 'ERROR',
            value: errorMatch[0],
            position
          };
          console.log('Found ERROR token:', token);
          tokens.push(token);
          remaining = remaining.slice(errorMatch[0].length);
          position += errorMatch[0].length;
        } else {
          // Skip any remaining characters if we can't match anything
          remaining = remaining.slice(1);
          position += 1;
        }
      }
    }

    console.log('Final tokens:', tokens);
    return tokens;
  }
}
