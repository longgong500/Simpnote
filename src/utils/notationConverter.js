import { NotationError } from './errors';

const DESCRIPTION_FIELDS = {
  'T': 'title',
  'K': 'key'
};

const WESTERN_TO_CHINESE = {
  'C': '1',
  'D': '2',
  'E': '3',
  'F': '4',
  'G': '5',
  'A': '6',
  'B': '7',
  'z': '0',
  'Z': '0'
};

const DURATION_MARKERS = {
  'q': '',    // quarter note
  'e': '_',   // eighth note
  's': '__',  // sixteenth note
  'h': '-'    // half note
};

function parseDescriptionHeader(notation) {
  const lines = notation.split('\n');
  const description = {};
  
  for (const line of lines) {
    const match = line.match(/^([A-Z]):\s*(.*)$/);
    if (match) {
      const [_, field, value] = match;
      if (DESCRIPTION_FIELDS[field]) {
        description[DESCRIPTION_FIELDS[field]] = value.trim();
      }
    }
  }
  
  return description;
}

function parseMusicNotation(notation) {
  const lines = notation.split('\n');
  const musicLines = lines.filter(line => !line.match(/^[A-Z]:/));
  return musicLines.join('\n').trim();
}

export function convertWesternToChinese(westernNotation) {
  if (!westernNotation || westernNotation.trim() === '') {
    return { description: {}, notation: '' };
  }

  const description = parseDescriptionHeader(westernNotation);
  const musicNotation = parseMusicNotation(westernNotation);

  // Split input into individual notes and bar lines
  const elements = musicNotation.split(/\s+/).filter(el => el.length > 0);

  if (elements.length === 0) {
    return { description, notation: '' };
  }

  const notation = elements.map(element => {
    // Handle bar lines
    if (element === '|') {
      return '|';
    }

    // Parse note and duration
    const [note, duration = 'q'] = element.split('/');
    const baseNote = note[0].toUpperCase();
    const chineseNote = WESTERN_TO_CHINESE[baseNote];
    
    if (!chineseNote) {
      throw new NotationError(`Invalid note: ${note}`);
    }

    // Get duration marker
    const marker = DURATION_MARKERS[duration] || '';
    
    // Combine note and duration marker
    return chineseNote + marker;
  }).join(' ');

  return {
    description,
    notation
  };
}
