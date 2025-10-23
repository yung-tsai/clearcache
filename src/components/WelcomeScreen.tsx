import { useState } from 'react';
import logomark from '@/assets/logo-mark.png';

interface WelcomeScreenProps {
  onEnter: () => void;
  onOpenNewEntry: () => void;
}

export function WelcomeScreen({ onEnter, onOpenNewEntry }: WelcomeScreenProps) {
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" style={{ gap: '20px' }}>
      <img 
        src={logomark} 
        alt="Clear Cache" 
        style={{ width: '200px', height: 'auto' }}
      />
      
      <p
        style={{
          fontFamily: 'Trispace, sans-serif',
          fontWeight: 600,
          fontSize: '30px',
          lineHeight: '1.2',
          letterSpacing: '-0.004em',
          textAlign: 'center',
          color: '#000',
        }}
      >
        Welcome. Ready to clear your mind?
      </p>
      
      <div className="flex flex-row items-center" style={{ gap: '12px' }}>
        <button
          onClick={onEnter}
          onMouseDown={() => setPressedButton('not-yet')}
          onMouseUp={() => setPressedButton(null)}
          onMouseLeave={() => setPressedButton(null)}
          className="flex flex-row justify-center items-center bg-white border border-black text-black transition-all"
          style={{
            padding: '15px',
            width: '154px',
            height: '56px',
            boxShadow: pressedButton === 'not-yet' ? 'none' : '2px 2px 0px #000000',
            fontFamily: 'Trispace, sans-serif',
            fontWeight: 500,
            fontSize: '20px',
            lineHeight: '26px',
            letterSpacing: '-0.004em',
          }}
        >
          Not Yet
        </button>
        
        <button
          onClick={onOpenNewEntry}
          onMouseDown={() => setPressedButton('yes')}
          onMouseUp={() => setPressedButton(null)}
          onMouseLeave={() => setPressedButton(null)}
          className="flex flex-row justify-center items-center bg-white border border-black text-black transition-all"
          style={{
            padding: '15px',
            width: '154px',
            height: '56px',
            boxShadow: pressedButton === 'yes' ? 'none' : '2px 2px 0px #000000',
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
