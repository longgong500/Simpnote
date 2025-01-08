import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as Vex from 'vexflow';
import { convertABCToVexFlow } from './utils/abcNotationConverter';

class MusicErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Music rendering error:', error, errorInfo);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const MusicSheet = ({ notation, onError }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas ref not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context not available');
      return;
    }

    if (!notation.trim()) {
      return;
    }

    try {
      console.log('Starting rendering with notation:', notation);

      // Calculate canvas dimensions based on content
      const calculateCanvasSize = (staveElements, hasLyrics) => {
        const baseWidth = Math.max(window.innerWidth * 0.8, 400);
        const measuresCount = staveElements.filter(elem => elem.type === '|').length + 1;
        const totalWidth = Math.max(baseWidth, measuresCount * 200);
        const baseHeight = 200;
        const lyricsHeight = hasLyrics ? 100 : 0;
        return { width: totalWidth, height: baseHeight + lyricsHeight };
      };

      // Only proceed if we have notation
      if (!notation.trim()) {
        console.log('Empty notation, clearing canvas');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Parse the ABC notation
      const { title, key, staveElements, lyrics } = convertABCToVexFlow(notation);
      console.log('Parsed ABC notation:', { title, key, staveElements, lyrics });

      // Calculate canvas size
      const canvasSize = calculateCanvasSize(staveElements, lyrics.length > 0);
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Initialize VexFlow renderer
      console.log('Initializing VexFlow renderer');
      const renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
      console.log('Renderer created:', renderer);
      renderer.resize(canvas.width, canvas.height);
      const context = renderer.getContext();
      console.log('Context created:', context);

      // Draw title if exists
      if (title) {
        console.log('Drawing title:', title);
        context.setFont('16px Times');
        context.fillText(title, 10, 30);
      }

      // Create and configure stave
      console.log('Creating stave with key:', key);
      const stave = new Vex.Flow.Stave(40, 40, canvasSize.width - 50);
      stave.addClef('treble');

      if (key) {
        stave.addKeySignature(key);
      }

      stave.setContext(context).draw();

      // Only create voice if we have notes
      const validElements = staveElements.filter(elem => elem.type === 'note' || elem.type === 'barline');
      console.log('Valid elements for voice:', validElements);

      if (validElements.length === 0) {
        console.log('No valid elements found');
        return;
      }

      // Create voice with SOFT mode for flexibility
      const voice = new Vex.Flow.Voice({
        num_beats: 4,
        beat_value: 4,
        resolution: Vex.Flow.RESOLUTION
      }).setMode(Vex.Flow.Voice.Mode.SOFT);

      // Process notes and barlines
      console.log('Processing notes and barlines');
      const notes = validElements.map(elem => {
        if (elem.type === 'barline') {
          return new Vex.Flow.BarNote();
        }

        const note = new Vex.Flow.StaveNote({
          clef: 'treble',
          keys: elem.keys,
          duration: elem.duration || 'q'
        });

        if (elem.text) {
          console.log('Adding lyrics to note:', elem.text);
          const annotation = new Vex.Flow.Annotation(elem.text)
            .setVerticalJustification(Vex.Flow.AnnotationVerticalJustify.BOTTOM)
            .setJustification(Vex.Flow.AnnotationHorizontalJustify.CENTER)
            .setFont('Arial', 12, 'normal');
          note.addModifier(annotation, 0);
        }

        return note;
      });

      voice.addTickables(notes);

      // Format and draw
      console.log('Formatting and drawing voice');
      const formatter = new Vex.Flow.Formatter()
        .joinVoices([voice])
        .format([voice], canvasSize.width - 150);

      // Preformat modifiers to ensure proper lyrics positioning
      notes.forEach(note => {
        if (note instanceof Vex.Flow.StaveNote) {
          note.getModifierContext().preFormat();
        }
      });

      voice.draw(context, stave);
    } catch (error) {
      console.error('Failed to render notation:', error);
      onError(error instanceof Error ? error : new Error(error?.message || '发生未知错误'));
    }

    // Cleanup function
    return () => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, [notation, onError]);

  return (
    <div style={{ width: '100%', overflowX: 'auto', backgroundColor: '#fff', padding: '20px' }}>
      <canvas ref={canvasRef} style={{ display: 'block', margin: '20px auto' }} />
    </div>
  );

const MusicSheetWithErrorBoundary = (props) => (
  <MusicErrorBoundary onError={props.onError}>
    <MusicSheet {...props} />
  </MusicErrorBoundary>
);

const App = () => {
  const [inputNotation, setInputNotation] = useState('');
  const [error, setError] = useState(null);
  const handleInputChange = (e) => {
    setInputNotation(e.target.value);
    setError(null);
  };

  const handleTimeSignatureChange = (e) => {
    setTimeSignature(e.target.value);
  };

  const handleTempoChange = (e) => {
    setTempo(Number(e.target.value));
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div className="input-section">
        <h2>输入乐谱</h2>
        <p>示例格式:</p>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
{`T: 小燕子
K: F
[V: 1]E G C A | G
w: 小燕子穿花

格式说明:
T: - 标题
K: - 调号 (C, G, D, A, E, B, F)
[V: 1] - 声部标记
w: - 歌词`}
        </pre>
        <textarea
          value={inputNotation}
          onChange={handleInputChange}
          style={{
            width: '100%',
            height: '200px',
            fontFamily: 'monospace',
            padding: '10px',
            marginBottom: '10px',
            resize: 'vertical',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          placeholder={`请输入乐谱，格式如下：
T: 标题
K: 调号
[V: 1]音符 | 小节线
w: 歌词`}
        />
        {error && (
          <div style={{
            color: 'red',
            padding: '10px',
            backgroundColor: '#fff0f0',
            borderRadius: '4px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {error.message || '发生未知错误'}
          </div>
        )}
      </div>
      <div className="score-section">
        <h2>乐谱显示</h2>
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'auto'
        }}>
          <MusicSheetWithErrorBoundary notation={inputNotation} onError={setError} />
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
