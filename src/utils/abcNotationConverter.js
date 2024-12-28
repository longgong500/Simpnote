/**
 * Converts ABC notation to VexFlow components
 * Handles conversion of parsed ABC notation into renderable VexFlow elements
 */
import { ABCNotationParser } from './abcNotationParser';
import { Factory } from 'vexflow';

export function convertABCToVexFlow(input) {
  const parser = new ABCNotationParser();
  const result = parser.parse(input);

  if (result.errors.length > 0) {
    throw new Error(result.errors.map(e => `第${e.line}行: ${e.message}`).join('\n'));
  }

  return {
    title: result.title,
    keySignature: result.keySignature || 'C',
    staveElements: convertNotesToVexFlow(result.notes),
    lyrics: convertLyricsToVexFlow(result.lyrics, result.notes),
    errors: result.errors
  };
}

function convertNotesToVexFlow(notes) {
  return notes.map(note => {
    if (note.type === 'barline') {
      return { type: 'barline' };
    }
    return {
      type: 'note',
      keys: [`${note.pitch}/4`],
      duration: 'q'
    };
  });
}

function convertLyricsToVexFlow(lyrics, notes) {
  if (!lyrics.length) return [];

  return lyrics.map(lyricLine => {
    const { syllables, voice } = lyricLine;
    return syllables.map((text, index) => ({
      text,
      duration: 'q',
      font: {
        family: 'Arial',
        size: 12,
        weight: ''
      }
    }));
  }).flat();
}

export function renderVexFlowScore(context, width, height, elements) {
  const factory = new Factory({
    renderer: { elementId: context, width, height }
  });

  const score = factory.EasyScore();
  const system = factory.System();

  // Add title if present
  if (elements.title) {
    system.addStave({
      x: 10,
      y: 0,
      width: width - 20
    }).addClef('treble').addKeySignature(elements.keySignature);

    const title = factory.StaveText({
      text: elements.title,
      position: 1
    });
    system.parts[0].stave.addModifier(title);
  }

  // Add notes and barlines
  const voice = score.voice(elements.staveElements.map(elem => {
    if (elem.type === 'barline') {
      return '|';
    }
    return score.note(elem.keys.join(','), elem.duration);
  }));

  // Add lyrics if present
  if (elements.lyrics.length > 0) {
    const textNotes = elements.lyrics.map(lyric =>
      new factory.TextNote({
        text: lyric.text,
        duration: lyric.duration,
        font: lyric.font
      })
    );

    const textVoice = score.voice(textNotes);
    system.addVoice(textVoice);
  }

  system.addVoice(voice);
  factory.draw();

  return factory;
}
