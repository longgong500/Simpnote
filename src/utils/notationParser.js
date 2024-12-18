import { NotationError } from './errors';
import { LexicalAnalyzer } from './lexicalAnalyzer';

export class NotationParser {
  constructor() {
    this.lexer = new LexicalAnalyzer();
    this.baseTimeValue = 4; // Default 1/4
  }

  parse(input) {
    const tokens = this.lexer.tokenize(input);
    const result = {
      timeSignature: null,
      notes: [],
      measures: []
    };

    let currentMeasure = [];
    let currentPosition = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'ERROR') {
        throw new NotationError(`无效的输入: ${token.value}`, token.position);
      }

      // Handle time signature
      if (token.type === 'TIME_SIGNATURE') {
        if (result.timeSignature) {
          throw new NotationError('时值标记只能出现一次', token.position);
        }
        const match = token.value.match(/L:[\s]*1\/(\d+)/);
        if (!match) {
          throw new NotationError('无效的时值标记格式', token.position);
        }
        this.baseTimeValue = parseInt(match[1], 10);
        result.timeSignature = this.baseTimeValue;
        continue;
      }

      // Handle notes and rests
      if (token.type === 'NOTE' || token.type === 'REST') {
        let duration = this.baseTimeValue;

        // Look ahead for time modifiers
        if (i + 1 < tokens.length && tokens[i + 1].type === 'TIME_MODIFIER') {
          const modifier = tokens[i + 1].value;
          if (modifier === '/') {
            duration *= 0.5;
          } else {
            duration *= parseInt(modifier, 10);
          }
          i++; // Skip the modifier token
        }

        const note = {
          type: token.type,
          value: token.value,
          duration,
          position: token.position
        };

        currentMeasure.push(note);
        continue;
      }

      // Handle bar lines
      if (token.type === 'BARLINE') {
        if (currentMeasure.length > 0) {
          result.measures.push([...currentMeasure]);
          result.notes.push(...currentMeasure);
          currentMeasure = [];
        }
        continue;
      }
    }

    // Handle any remaining notes in the last measure
    if (currentMeasure.length > 0) {
      result.measures.push([...currentMeasure]);
      result.notes.push(...currentMeasure);
    }

    // Validate measures
    if (result.measures.length > 0) {
      const expectedDuration = result.timeSignature ? result.timeSignature : this.baseTimeValue;
      result.measures.forEach((measure, index) => {
        const measureDuration = measure.reduce((sum, note) => sum + note.duration, 0);
        if (measureDuration !== expectedDuration) {
          throw new NotationError(
            `第${index + 1}小节的时值不匹配 (期望: ${expectedDuration}, 实际: ${measureDuration})`,
            measure[0].position
          );
        }
      });
    }

    return result;
  }
}
