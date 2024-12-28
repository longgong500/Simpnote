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
  const rendererRef = useRef(null);

  useEffect(() => {
    onError(null);

    if (!canvasRef.current || !notation) {
      return () => {};
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法获取画布上下文');
      }

      canvas.width = 800;
      canvas.height = 200;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
      rendererRef.current = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
      rendererRef.current.resize(800, 200);

      const { title, keySignature, staveElements, lyrics } = convertABCToVexFlow(notation);

      const measureWidth = 200;
      const totalWidth = Math.max(800, staveElements.length * measureWidth);
      canvas.width = totalWidth;
      rendererRef.current.resize(totalWidth, 200);

      const stave = new Vex.Flow.Stave(10, 40, totalWidth - 20);
      stave.addClef('treble');

      if (title) {
        const titleText = new Vex.Flow.StaveText(title, Vex.Flow.StaveText.Position.TOP);
        stave.addModifier(titleText);
      }

      if (keySignature) {
        const keySign = new Vex.Flow.KeySignature(keySignature);
        stave.addModifier(keySign);
      }

      stave.setContext(rendererRef.current.getContext()).draw();

      const voice = new Vex.Flow.Voice({
        num_beats: 4,
        beat_value: 4,
        resolution: Vex.Flow.RESOLUTION
      });

      const notes = staveElements.map(elem => {
        if (elem.type === 'barline') {
          return new Vex.Flow.BarNote();
        }
        return new Vex.Flow.StaveNote(elem);
      });
      voice.addTickables(notes);

      let lyricsVoice = null;
      if (lyrics && lyrics.length > 0) {
        lyricsVoice = new Vex.Flow.Voice({
          num_beats: 4,
          beat_value: 4,
          resolution: Vex.Flow.RESOLUTION
        });

        const textNotes = lyrics.map(lyric =>
          new Vex.Flow.TextNote({
            text: lyric.text,
            duration: lyric.duration,
            font: {
              family: 'Arial',
              size: 12,
              weight: ''
            }
          }).setLine(11)
        );
        lyricsVoice.addTickables(textNotes);
      }

      const formatter = new Vex.Flow.Formatter();
      const voices = [voice];
      if (lyricsVoice) {
        voices.push(lyricsVoice);
      }

      formatter.joinVoices(voices).formatToStave(voices, stave);
      voices.forEach(v => v.draw(rendererRef.current.getContext(), stave));

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
        width: '100%',
        height: '200px',
        backgroundColor: '#fff',
        border: '1px solid #ddd'
      }}
    />
  );
};

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
