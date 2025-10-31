import { useState, useEffect } from 'react';
import logomark from '@/assets/logomark-2.png';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface WelcomeScreenProps {
  onEnter: () => void;
  onOpenNewEntry: () => void;
}

export function WelcomeScreen({ onEnter, onOpenNewEntry }: WelcomeScreenProps) {
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const { playSound } = useSoundEffects();

  useEffect(() => {
    playSound('login');
  }, [playSound]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" style={{ gap: '20px', border: '4px solid #000', margin: '0' }}>
      <img 
        src={logomark} 
        alt="Clear Cache" 
        style={{ width: '85px', height: 'auto' }}
      />
      
      <p
        style={{
          fontFamily: 'Trispace, sans-serif',
          fontWeight: 500,
          fontSize: '24px',
          lineHeight: '1.2',
          letterSpacing: '-0.004em',
          textAlign: 'center',
          color: '#000',
          whiteSpace: 'pre-line'
        }}
      >
        {'Hi there. Ready to clear\nyour mind?'}
      </p>
      
      <div className="flex flex-row items-center" style={{ gap: '12px' }}>
        <button
          onClick={onEnter}
          onMouseDown={() => setPressedButton('not-yet')}
          onMouseUp={() => setPressedButton(null)}
          onMouseLeave={() => setPressedButton(null)}
          className="flex flex-row justify-center items-center bg-white border border-black text-black transition-all"
          style={{
            padding: '10px 30px',
            width: 'auto',
            height: 'auto',
            boxShadow: pressedButton === 'not-yet' ? 'none' : 'rgb(0, 0, 0) 3px 3px 0px',
            fontFamily: 'Trispace, sans-serif',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '26px',
            letterSpacing: '-0.004em',
          }}
        >
          No
        </button>
        
        <button
          onClick={onOpenNewEntry}
          onMouseDown={() => setPressedButton('yes')}
          onMouseUp={() => setPressedButton(null)}
          onMouseLeave={() => setPressedButton(null)}
          className="flex flex-row justify-center items-center bg-white border border-black text-black transition-all"
          style={{
            padding: '10px 30px',
            width: 'auto',
            height: 'auto',
            boxShadow: pressedButton === 'yes' ? 'none' : 'rgb(0, 0, 0) 3px 3px 0px',
            fontFamily: 'Trispace, sans-serif',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '26px',
            letterSpacing: '-0.004em',
          }}
        >
          Yes
        </button>
      </div>
    </div>
  );
}
