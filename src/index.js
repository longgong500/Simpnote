import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { convertWesternToChinese } from './utils/notationConverter';
import './index.css';

const MusicSheet = ({ notation, timeSignature, tempo }) => {
  const [measures, setMeasures] = useState([]);

  useEffect(() => {
    if (!notation) return;
    
    // Split notation into measures based on bar lines
    const measureGroups = notation.split('|');
    setMeasures(measureGroups);
  }, [notation]);

  const canvasRef = useRef(null);
  const [renderTrigger, setRenderTrigger] = useState(false);

  const handleRender = () => {
    setRenderTrigger(prev => !prev);
  };

  useEffect(() => {
    if (!canvasRef.current || !notation) return;

    if (!notation.trim()) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      const { description, notation: chineseNotation } = convertWesternToChinese(notation);
      
      // Draw description header
      context.font = '24px Arial';
      context.textAlign = 'left';
      context.fillStyle = 'black';
      
      let y = 30;
      
      if (description.title) {
        context.fillText(`标题: ${description.title}`, 20, y);
        y += 30;
      }
      
      if (description.key) {
        context.fillText(`调号: ${description.key}`, 20, y);
        y += 30;
      }
      
      // Add padding below description
      y += 20;
      
      // Set up text rendering for notation
      context.font = '48px Arial';
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillStyle = 'black';
      
      // Calculate line breaks and spacing
      const maxWidth = canvas.width - 40; // 20px padding on each side
      const lineHeight = 60;
      let x = 20;
      
      // Split notation into individual elements
      // Calculate measure width based on time signature
      const [beats, beatValue] = timeSignature.split('/').map(Number);
      const measureWidth = (maxWidth - 40) / beats;
      
      // Split notation into measures
      const measures = chineseNotation.split('|');
      
      measures.forEach((measure, measureIndex) => {
        const elements = measure.split(' ').filter(el => el.length > 0);
        let measureX = 20 + measureIndex * measureWidth;
        
        elements.forEach((element, index) => {
          // Measure text width
          const textWidth = context.measureText(element).width;
          
          // Draw the element
          context.fillText(element, measureX, y);
          
          // Add space after element
          measureX += textWidth + 20;
        });
        
        // Draw bar line
        if (measureIndex < measures.length - 1) {
          context.beginPath();
          context.moveTo(measureX + 5, y - 30);
          context.lineTo(measureX + 5, y + 30);
          context.stroke();
        }
        
        // Handle line breaks
        if (measureX > maxWidth) {
          x = 20;
          y += lineHeight;
        }
      });
    } catch (error) {
      console.error('Failed to render notation:', error);
    }
  }, [notation, renderTrigger]);

  if (!notation) {
    return <div>Please enter valid music notation.</div>;
  }

  return (
    <div>
      <canvas id="music-canvas" ref={canvasRef} width={800} height={300} />
      <button onClick={handleRender} style={{ marginTop: '10px' }}>
        渲染简谱
      </button>
    </div>
  );
};

const App = () => {
  const [inputNotation, setInputNotation] = useState('');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tempo, setTempo] = useState(120);

  const handleInputChange = (e) => {
    setInputNotation(e.target.value);
  };

  const handleTimeSignatureChange = (e) => {
    setTimeSignature(e.target.value);
  };

  const handleTempoChange = (e) => {
    setTempo(Number(e.target.value));
  };

  return (
    <div>
      <h1>简谱打谱软件</h1>
      <div className="controls">
        <div className="control-group">
          <label>拍号：</label>
          <select value={timeSignature} onChange={handleTimeSignatureChange}>
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
            <option value="6/8">6/8</option>
          </select>
        </div>
        <div className="control-group">
          <label>速度：</label>
          <input 
            type="number" 
            value={tempo} 
            onChange={handleTempoChange}
            min={40}
            max={200}
          />
        </div>
      </div>
      <p>请输入音名（例如：C D E F G）</p>
      <textarea value={inputNotation} onChange={handleInputChange} />
      <MusicSheet 
        notation={inputNotation} 
        timeSignature={timeSignature}
        tempo={tempo}
      />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
