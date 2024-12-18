import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as Vex from 'vexflow';
import { convertChineseToVexFlow } from './utils/notationConverter';

const MusicSheet = ({ notation }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !notation) return; // Check if notation is available

    // Check if notation is empty or contains only whitespace
    if (!notation.trim()) {
      return;
    }

    try {
      // Clear previous content
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

    try {
      const notes = score.notes(notation);
      const voice = score.voice(notes);
      const formatter = vf.Formatter();

      const stave = vf.Stave({ x: 10, y: 10, width: 500, num_lines: 5 });
      formatter.joinVoices([voice]).formatToStave([voice], stave);
      stave.addClef('treble').addTimeSignature('4/4');
      voice.draw({ stave: stave, x: 10, formatter: formatter });
    } catch (error) {
      console.error("Error rendering music sheet:", error);
      return;
    }

      try {
        // Convert notation and create notes
        const vexFlowNotes = convertChineseToVexFlow(notation)
          .split(' ')
          .map(noteName => {
            return new Vex.Flow.StaveNote({
              keys: [noteName.toLowerCase()],
              duration: "q"
            });
          });

        // Create a voice and add notes
        const voice = new Vex.Flow.Voice({
          num_beats: 4,
          beat_value: 4,
          resolution: Vex.Flow.RESOLUTION
        });
        voice.addTickables(vexFlowNotes);

        // Format and draw
        new Vex.Flow.Formatter()
          .joinVoices([voice])
          .format([voice], 780);
        voice.draw(context2, stave);
      } catch (error) {
        console.error('Failed to render notation:', error);
      }
    } catch (error) {
      console.error('Failed to initialize VexFlow:', error);
    }
  }, [notation]);

  if (!notation) {
    return <div>Please enter valid music notation.</div>; // Display message if notation is empty
  }

  return <canvas id="music-canvas" ref={canvasRef} />;
};

const App = () => {
  const [inputNotation, setInputNotation] = useState('');

  const handleInputChange = (e) => {
    setInputNotation(e.target.value);
  };

  return (
    <div>
      <h1>简谱打谱软件</h1>
      <p>请输入数字简谱（例如：1 2 3 4 5）</p>
      <textarea value={inputNotation} onChange={handleInputChange} />
      <MusicSheet notation={inputNotation} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
