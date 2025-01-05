import { NotationError, TimeSignatureError, MeasureError } from './errors';
import { LexicalAnalyzer } from './lexicalAnalyzer';

const DESCRIPTION_FIELDS = {
  'T': 'title',
  'K': 'key'
};


export function convertChineseToVexFlow(chineseNotation) {
  if (!chineseNotation || chineseNotation.trim() === '') {
    return { measures: [], timeSignature: '4/4' };  // Default time signature
  }
  
  return description;
}

  const lexer = new LexicalAnalyzer();
  const tokens = lexer.tokenize(chineseNotation.trim());

  let baseTimeValue = 4; // Default to quarter notes
  let currentMeasure = [];
  let measures = [];
  let timeSignature = '4/4'; // Default time signature
  let expectedNotesPerMeasure = 4; // Default to 4 notes per measure

  // First token should be time signature
  if (tokens.length > 0 && tokens[0].type === 'TIME_SIGNATURE') {
    const match = tokens[0].value.match(/L:(\d+)\/(\d+)/);
    if (!match) {
      throw new TimeSignatureError('无效的时值设置', tokens[0].position);
    }
    const numerator = parseInt(match[1], 10);
    const denominator = parseInt(match[2], 10);

    // Validate time signature values
    if (denominator <= 0) {
      throw new TimeSignatureError('无效的时值设置', tokens[0].position);
    }
    if (numerator <= 0) {
      throw new TimeSignatureError('无效的时值设置', tokens[0].position);
    }

    baseTimeValue = denominator;
    timeSignature = `${numerator}/${denominator}`; // Use original time signature
    expectedNotesPerMeasure = 4; // Always use 4 notes per measure for simplicity
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let vexDuration = '8'; // Default to eighth note

    switch (token.type) {
      case 'TIME_SIGNATURE':
        if (i !== 0) {
          throw new TimeSignatureError('时值标记必须在开始位置', token.position);
        }
        break;

      case 'NOTE':
        const baseNote = CHINESE_TO_WESTERN[token.value];
        if (!baseNote) {
          throw new NotationError(`无效的音符: ${token.value}`, token.position);
        }

        // Convert baseTimeValue to VexFlow duration
        switch (baseTimeValue) {
          case 1: vexDuration = 'w'; break;  // whole note
          case 2: vexDuration = 'h'; break;  // half note
          case 4: vexDuration = 'q'; break;  // quarter note
          case 8: vexDuration = '8'; break;  // eighth note
          case 16: vexDuration = '16'; break; // sixteenth note
          default: vexDuration = '8'; // Default to eighth note
        }

        // Look ahead for time modifier
        if (i + 1 < tokens.length && tokens[i + 1].type === 'TIME_MODIFIER') {
          const modifier = tokens[i + 1].value;
          if (modifier === '/') {
            // Halve the duration
            switch (vexDuration) {
              case 'w': vexDuration = 'h'; break;
              case 'h': vexDuration = 'q'; break;
              case 'q': vexDuration = '8'; break;
              case '8': vexDuration = '16'; break;
              case '16': vexDuration = '32'; break;
            }
          } else {
            // Multiply the duration
            const multiplier = parseInt(modifier, 10);
            // Adjust duration based on multiplier
            switch (vexDuration) {
              case '16': if (multiplier <= 2) vexDuration = '8'; break;
              case '8': if (multiplier <= 2) vexDuration = 'q'; break;
              case 'q': if (multiplier <= 2) vexDuration = 'h'; break;
              case 'h': if (multiplier <= 2) vexDuration = 'w'; break;
            }
          }
          i++; // Skip the modifier token
        }

        currentMeasure.push({
          keys: [`${baseNote}/4`],  // VexFlow expects keys array with octave
          duration: vexDuration,
          auto_stem: true
        });
        break;

      case 'REST':
        // Convert baseTimeValue to VexFlow duration
        switch (baseTimeValue) {
          case 1: vexDuration = 'wr'; break;  // whole rest
          case 2: vexDuration = 'hr'; break;  // half rest
          case 4: vexDuration = 'qr'; break;  // quarter rest
          case 8: vexDuration = '8r'; break;  // eighth rest
          case 16: vexDuration = '16r'; break; // sixteenth rest
          default: vexDuration = '8r'; // Default to eighth rest
        }
        currentMeasure.push({
          keys: ['B/4'],
          duration: `${vexDuration}r`  // Using vexDuration for rests
        });
        break;

      case 'BARLINE':
        if (currentMeasure.length > 0) {
          measures.push([...currentMeasure]);
          currentMeasure = [];
        }
        break;

      case 'ERROR':
        throw new NotationError('无效的音符', token.position);
    }
  }

  // Handle last measure if it exists
  if (currentMeasure.length > 0) {
    measures.push([...currentMeasure]);
  }

  // Validate all measures after collection
  for (let i = 0; i < measures.length; i++) {
    if (measures[i].length !== expectedNotesPerMeasure) {
      throw new MeasureError('小节时值不匹配', tokens[tokens.length - 1].position);
    }
  }

  return { measures, timeSignature };
}
