import { useState } from 'react';
import clearCacheLogo from '@/assets/Clear_Cache_Logo.png';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      <img 
        src={clearCacheLogo} 
        alt="Clear Cache" 
        style={{ width: '320px', height: 'auto' }}
      />
      
      <button
        onClick={onEnter}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className="flex flex-row justify-center items-center bg-white border border-black text-black transition-all"
        style={{
          padding: '15px',
          gap: '10px',
          width: '88px',
          height: '56px',
          boxShadow: isPressed ? 'none' : '2px 2px 0px #000000',
          fontFamily: 'ChicagoFLF',
          fontWeight: 500,
          fontSize: '20px',
          lineHeight: '26px',
          letterSpacing: '-0.004em',
        }}
      >
        Enter
      </button>
    </div>
  );
}
