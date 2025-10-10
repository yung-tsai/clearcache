import { useRef, useCallback } from 'react';

// Sound effect types
export type SoundEffect = 'windowOpen' | 'windowClose' | 'buttonClick' | 'keyPress';

// Simple beep sounds using Web Audio API as placeholders
// Users can replace these with actual sound files later
const createBeep = (frequency: number, duration: number, volume: number = 0.3) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const useSoundEffects = () => {
  const audioCache = useRef<Map<SoundEffect, HTMLAudioElement>>(new Map());

  const playSound = useCallback((effect: SoundEffect) => {
    try {
      // For now, use simple beep sounds as placeholders
      // Users can replace with actual sound files by updating the switch cases
      switch (effect) {
        case 'windowOpen':
          // High-pitched pop (like Mac window opening)
          createBeep(800, 0.1, 0.2);
          break;
        case 'windowClose':
          // Lower pop (like Mac window closing)
          createBeep(600, 0.08, 0.15);
          break;
        case 'buttonClick':
          // Sharp click
          createBeep(1000, 0.05, 0.15);
          break;
        case 'keyPress':
          // Subtle key click
          createBeep(1200, 0.03, 0.1);
          break;
      }
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Sound effect failed:', error);
    }
  }, []);

  return { playSound };
};
