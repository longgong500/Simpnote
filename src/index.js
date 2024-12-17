import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as Vex from 'vexflow';
import { convertChineseToVexFlow } from './utils/notationConverter';

const MusicSheet = ({ notation }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !notation) return;

    try {
      // Clear previous content
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Initialize VexFlow
      const renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
      renderer.resize(800, 150);
      const context2 = renderer.getContext();
      context2.setFont("Arial", 10);

      // Create a stave
      const stave = new Vex.Flow.Stave(10, 10, 780);
      stave.addClef("treble").addTimeSignature("4/4");
      stave.setContext(context2).draw();

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

  return <canvas id="music-canvas" ref={canvasRef} style={{ width: '800px', height: '150px' }} />;
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
