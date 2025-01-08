/**
 * Converts ABC notation to VexFlow components
 * Handles conversion of parsed ABC notation into renderable VexFlow elements
 */
import * as Vex from 'vexflow';
import { ABCNotationParser } from './abcNotationParser';

export function convertABCToVexFlow(input) {
  if (!input) {
    return { title: '', key: '', staveElements: [], lyrics: [] };
  }

  const parser = new ABCNotationParser();
  const { title, key, notes } = parser.parse(input);

  const staveElements = notes.map(note => {
    if (note.type === 'barline') {
      return { type: 'barline' };
    }

    // Ensure proper VexFlow note format
    const keys = note.keys.map(key => {
      const [pitch, octave] = key.split('/');
      // VexFlow requires lowercase note names
      return `${pitch.toLowerCase()}/${octave || '4'}`;
    });

    return {
      type: 'note',
      keys,
      duration: note.duration || 'q',
      auto_stem: true,
      text: note.text // Lyrics will be attached here
    };
  });

  return {
    title,
    key,
    staveElements,
    lyrics: notes.filter(note => note.text).map(note => note.text)
  };
}
