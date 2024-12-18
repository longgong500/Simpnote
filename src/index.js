import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import * as Vex from 'vexflow';
import { convertChineseToVexFlow } from './utils/notationConverter';

// Error boundary component to catch rendering errors
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
      return null; // Return empty to allow parent to show error message
    }
    return this.props.children;
  }
}

const MusicSheet = ({ notation, onError }) => {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    // Clear any previous errors at the start
    onError(null);

    if (!canvasRef.current || !notation) {
      return () => {};
    }

    try {
      // Clear previous content
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法获取画布上下文');
      }

      // Set initial dimensions
      canvas.width = 800;
      canvas.height = 150;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Initialize VexFlow with error handling
      try {
        if (rendererRef.current) {
          rendererRef.current.destroy();
        }
        rendererRef.current = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
        rendererRef.current.resize(800, 150);
      } catch (initError) {
        console.error('VexFlow initialization error:', initError);
        throw new Error('无法初始化乐谱渲染器');
      }

      // Convert notation and create notes
      const { measures, timeSignature } = convertChineseToVexFlow(notation);
      if (!measures || measures.length === 0) {
        throw new Error('无法转换简谱');
      }

      // Calculate width needed for all measures
      const measureWidth = 200; // Width per measure
      const totalWidth = Math.max(800, measures.length * measureWidth);
      canvas.width = totalWidth;

      // Add staves for each measure
      let currentX = 0;
      measures.forEach((measure, index) => {
        // Get time signature values
        const [beats, beatValue] = timeSignature.split('/').map(Number);

        // Create voice with correct time signature values
        const voice = new Vex.Flow.Voice({
          num_beats: beats,
          beat_value: beatValue,
          resolution: Vex.Flow.RESOLUTION
        });

        // Create notes from measure
        const notes = measure.map(note => {
          return new Vex.Flow.StaveNote({
            keys: note.keys,
            duration: note.duration,
            auto_stem: true
          });
        });

        // Add notes to voice
        voice.addTickables(notes);

        // Create and format stave
        const stave = new Vex.Flow.Stave(currentX, 0, 200);
        if (index === 0) {
          stave.addClef('treble').addTimeSignature(timeSignature);
        }
        stave.setContext(rendererRef.current.getContext()).draw();

        // Format and draw voice
        const formatter = new Vex.Flow.Formatter();
        formatter.joinVoices([voice]).format([voice], 180);
        voice.draw(rendererRef.current.getContext(), stave);

        currentX += 200;
      });

    } catch (error) {
      console.error('Failed to render notation:', error);
      onError(error instanceof Error ? error : new Error(error?.message || '发生未知错误'));
    }

    return () => {
      if (rendererRef.current) {
        try {
          rendererRef.current.destroy();
          rendererRef.current = null;
        } catch (error) {
          console.error('Error cleaning up renderer:', error);
        }
      }
    };
  }, [notation, onError]);

  return (
    <canvas
      id="music-canvas"
      ref={canvasRef}
      style={{
        width: '800px',
        height: '200px',
        backgroundColor: '#fff',
        border: '1px solid #ddd'
      }}
    />
  );
};

// Wrap MusicSheet with error boundary in export
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
        <h2>输入简谱</h2>
        <p>示例: L:1/8 1 2 3 4 | 5 6 7 1 |</p>
        <textarea
          value={inputNotation}
          onChange={handleInputChange}
          style={{
            width: '100%',
            height: '200px',
            fontFamily: 'monospace',
            padding: '10px',
            marginBottom: '10px',
            resize: 'vertical'
          }}
          placeholder="在此输入简谱..."
        />
        {error && (
          <div style={{
            color: 'red',
            padding: '10px',
            backgroundColor: '#fff0f0',
            borderRadius: '4px',
            marginTop: '10px',
            whiteSpace: 'pre-wrap'
          }}>
            {error.message || '发生未知错误'}
            {error.position !== undefined && ` (位置: ${error.position})`}
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
