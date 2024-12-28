import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as Vex from 'vexflow';
import { convertChineseToVexFlow } from './utils/notationConverter';

const { Stave, StaveNote, Voice, Formatter } = Vex.Flow;

const MusicSheet = ({ notation }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !notation) return;

    if (!notation.trim()) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const vexFlowNotes = convertChineseToVexFlow(notation)
          .split(' ')
          .map(noteName => {
            return new StaveNote({
              keys: [noteName.toLowerCase()],
              duration: "q"
            });
          });

        const voice = new Voice({
          num_beats: 4,
          beat_value: 4,
          resolution: Vex.Flow.RESOLUTION
        });
        voice.addTickables(vexFlowNotes);

        const mainStave = new Stave(10, 10, 780);
        mainStave.addClef('treble').addTimeSignature('4/4');
        new Formatter()
          .joinVoices([voice])
          .format([voice], 780);
        voice.draw(context, mainStave);
      } catch (error) {
        console.error('Failed to render notation:', error);
      }
    } catch (error) {
      console.error('Failed to initialize VexFlow:', error);
    }
  }, [notation]);

  if (!notation) {
    return <div>Please enter valid music notation.</div>;
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
