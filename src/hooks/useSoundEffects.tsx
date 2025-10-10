import { useRef, useCallback } from 'react';
import keyPressSound from '@/assets/key-press.mp3';
import loginSound from '@/assets/login-sound.mp3';
import windowOpenSound from '@/assets/window-open.mp3';

// Sound effect types
export type SoundEffect = 'windowOpen' | 'windowClose' | 'buttonClick' | 'keyPress' | 'login';

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
  const keyPressAudioPool = useRef<HTMLAudioElement[]>([]);
  const poolSize = 5; // Create multiple audio instances for rapid keypresses

  // Initialize audio pool for keypress
  const getKeyPressAudio = useCallback(() => {
    if (keyPressAudioPool.current.length === 0) {
      // Create initial pool
      for (let i = 0; i < poolSize; i++) {
        const audio = new Audio(keyPressSound);
        audio.volume = 0.3;
        keyPressAudioPool.current.push(audio);
      }
    }
    
    // Find an available audio instance (not playing)
    let audio = keyPressAudioPool.current.find(a => a.paused);
    if (!audio) {
      // If all are busy, use the first one and restart it
      audio = keyPressAudioPool.current[0];
      audio.currentTime = 0;
    }
    return audio;
  }, []);

  const playSound = useCallback((effect: SoundEffect) => {
    try {
      // For now, use simple beep sounds as placeholders
      // Users can replace with actual sound files by updating the switch cases
      switch (effect) {
        case 'windowOpen':
          // Use actual MP3 sound file
          const windowAudio = new Audio(windowOpenSound);
          windowAudio.volume = 0.4;
          windowAudio.play().catch(() => {});
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
          // Use actual MP3 sound file
          const audio = getKeyPressAudio();
          audio.play().catch(() => {});
          break;
        case 'login':
          // Use actual MP3 sound file
          const loginAudio = new Audio(loginSound);
          loginAudio.volume = 0.5;
          loginAudio.play().catch(() => {});
          break;
      }
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Sound effect failed:', error);
    }
  }, [getKeyPressAudio]);

  return { playSound };
};
