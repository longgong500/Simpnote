import { NotationError } from './errors';

const CHINESE_TO_WESTERN = {
  '1': 'C',
  '2': 'D',
  '3': 'E',
  '4': 'F',
  '5': 'G',
  '6': 'A',
  '7': 'B'
};

export function convertChineseToVexFlow(chineseNotation) {
  if (!chineseNotation || chineseNotation.trim() === '') {
    return '';
  }

  // Split input into individual notes, filtering out empty strings
  const notes = chineseNotation.trim().split(/\s+/).filter(note => note.length > 0);

  if (notes.length === 0) {
    return '';
  }

  // Convert to VexFlow format with note names only
  return notes.map(note => {
    const baseNote = CHINESE_TO_WESTERN[note];
    if (!baseNote) {
      throw new NotationError(`Invalid note: ${note}`);
    }
    return `${baseNote}/4`;  // Note name with octave
  }).join(' ');
}
