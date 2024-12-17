import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as Vex from 'vexflow';

const MusicSheet = ({ notation }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const vf = new Vex.Flow.Factory({ renderer: { elementId: canvasRef.current.id } });
    const score = vf.EasyScore();

    const notes = score.notes(notation);
    const voice = score.voice(notes);
    const formatter = vf.Formatter();

    const stave = vf.Stave({ x: 10, y: 10, width: 500, num_lines: 5 });
    formatter.joinVoices([voice]).formatToStave([voice], stave);
    stave.addClef('treble').addTimeSignature('4/4');
    voice.draw({ stave: stave, x: 10, formatter: formatter });

    return () => {
      // Cleanup if needed
    };
  }, [notation]);

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
      <textarea value={inputNotation} onChange={handleInputChange} />
      <MusicSheet notation={inputNotation} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
