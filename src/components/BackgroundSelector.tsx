import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import swatchPattern from '@/assets/swatch-pattern.png';
import dotsPattern from '@/assets/pattern-dots.png';
import linesPattern from '@/assets/pattern-lines.png';
import gridPattern from '@/assets/pattern-grid.png';
import grayGridPattern from '@/assets/pattern-gray-grid.png';
import bubblesPattern from '@/assets/pattern-bubbles.png';
import starsPattern from '@/assets/pattern-stars.png';
import catsPattern from '@/assets/pattern-cats.png';
import bearPattern from '@/assets/pattern-bear.png';
import plaidPattern from '@/assets/pattern-plaid.png';
import cyanWavesPattern from '@/assets/pattern-cyan-waves.png';
import purpleWavesPattern from '@/assets/pattern-purple-waves.png';
import darkDotsPattern from '@/assets/pattern-dark-dots.png';
import fineDotsPattern from '@/assets/pattern-fine-dots.png';
import stripesPattern from '@/assets/pattern-stripes.png';
import crosshatchPattern from '@/assets/pattern-crosshatch.png';
import blueLinesPattern from '@/assets/pattern-blue-lines.png';
import texturedDotsPattern from '@/assets/pattern-textured-dots.png';

interface BackgroundSelectorProps {
  onClose: () => void;
}

export interface BackgroundPreference {
  type: 'pattern' | 'color';
  value: string;
}

const patterns = [
  { name: 'Swatch', value: 'swatch', image: swatchPattern },
  { name: 'Dots', value: 'dots', image: dotsPattern },
  { name: 'Lines', value: 'lines', image: linesPattern },
  { name: 'Grid', value: 'grid', image: gridPattern },
  { name: 'Gray Grid', value: 'gray-grid', image: grayGridPattern },
  { name: 'Bubbles', value: 'bubbles', image: bubblesPattern },
  { name: 'Stars', value: 'stars', image: starsPattern },
  { name: 'Cats', value: 'cats', image: catsPattern },
  { name: 'Bear', value: 'bear', image: bearPattern },
  { name: 'Plaid', value: 'plaid', image: plaidPattern },
  { name: 'Cyan Waves', value: 'cyan-waves', image: cyanWavesPattern },
  { name: 'Purple Waves', value: 'purple-waves', image: purpleWavesPattern },
  { name: 'Dark Dots', value: 'dark-dots', image: darkDotsPattern },
  { name: 'Fine Dots', value: 'fine-dots', image: fineDotsPattern },
  { name: 'Stripes', value: 'stripes', image: stripesPattern },
  { name: 'Crosshatch', value: 'crosshatch', image: crosshatchPattern },
  { name: 'Blue Lines', value: 'blue-lines', image: blueLinesPattern },
  { name: 'Textured Dots', value: 'textured-dots', image: texturedDotsPattern },
];

const solidColors = [
  { name: 'Light Gray', value: '#E8E8E8' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
];

export function BackgroundSelector({ onClose }: BackgroundSelectorProps) {
  const { user } = useAuth();
  const [customColor, setCustomColor] = useState('#E8E8E8');
  const [hoveredPreference, setHoveredPreference] = useState<BackgroundPreference | null>(null);

  const savePreference = async (preference: BackgroundPreference) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    console.log('Saving background preference:', preference);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ background_preference: preference })
      .eq('user_id', user.id)
      .select();

    if (error) {
      toast.error('Failed to save background preference');
      console.error('Error saving background:', error);
    } else {
      console.log('Background saved successfully:', data);
      toast.success('Background updated');
      // Trigger a custom event to notify MacDesktop
      window.dispatchEvent(new CustomEvent('background-change', { detail: preference }));
      // Trigger profile reload
      window.dispatchEvent(new CustomEvent('reload-profile'));
      onClose();
    }
  };

  const handlePreviewOrSelect = (preference: BackgroundPreference, isHover: boolean) => {
    if (isHover) {
      setHoveredPreference(preference);
      window.dispatchEvent(new CustomEvent('background-preview', { detail: preference }));
    } else {
      savePreference(preference);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPreference(null);
    window.dispatchEvent(new CustomEvent('background-preview', { detail: null }));
  };

  return (
    <div className="absolute left-0 mt-0 bg-white border border-black/20 shadow-lg w-64 z-30">
      {/* Patterns Section */}
      <div className="p-3">
        <div className="font-mono text-xs font-bold mb-2">Patterns</div>
        <div className="grid grid-cols-4 gap-2">
          {patterns.map((pattern) => (
            <button
              key={pattern.value}
              className="flex flex-col items-center p-2 border border-black/20 hover:bg-blue-500 hover:text-white transition-colors group rounded"
              onMouseEnter={() => handlePreviewOrSelect({ type: 'pattern', value: pattern.value }, true)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handlePreviewOrSelect({ type: 'pattern', value: pattern.value }, false)}
            >
              <div 
                className="w-12 h-12 border border-black/20 rounded mb-1"
                style={{ 
                  backgroundImage: `url(${pattern.image})`,
                  backgroundSize: 'auto',
                  backgroundRepeat: 'repeat'
                }}
              />
              <span className="text-xs font-mono">{pattern.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-black/10 mx-2" />

      {/* Solid Colors Section */}
      <div className="p-3">
        <div className="font-mono text-xs font-bold mb-2">Solid Colors</div>
        <div className="flex gap-2 flex-wrap">
          {solidColors.map((color) => (
            <button
              key={color.value}
              className="flex flex-col items-center p-2 border border-black/20 hover:bg-blue-500 hover:text-white transition-colors group rounded"
              onMouseEnter={() => handlePreviewOrSelect({ type: 'color', value: color.value }, true)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handlePreviewOrSelect({ type: 'color', value: color.value }, false)}
            >
              <div 
                className="w-12 h-12 border border-black/20 rounded mb-1"
                style={{ backgroundColor: color.value }}
              />
              <span className="text-xs font-mono">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-black/10 mx-2" />

      {/* Custom Color Section */}
      <div className="p-3">
        <div className="font-mono text-xs font-bold mb-2">Custom Color</div>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            onMouseEnter={() => handlePreviewOrSelect({ type: 'color', value: customColor }, true)}
            onMouseLeave={handleMouseLeave}
            className="w-12 h-12 border border-black/20 rounded cursor-pointer"
          />
          <button
            className="flex-1 px-3 py-2 border border-black bg-white hover:bg-black hover:text-white transition-colors font-mono text-xs"
            onClick={() => savePreference({ type: 'color', value: customColor })}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
