import { useState } from 'react';
import { useScanlineSettings, INTENSITY_MAP } from '@/hooks/useScanlineSettings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function ScanlineSettings() {
  const { preferences, loading, toggleScanlines, setIntensity, setDensity, setCustomIntensity } = useScanlineSettings();
  const [previewingIntensity, setPreviewingIntensity] = useState<string | null>(null);
  const [previewDensity, setPreviewDensity] = useState<number | null>(null);

  if (loading) {
    return <div className="p-4">Loading scanline settings...</div>;
  }

  const handlePreview = (intensity: string) => {
    setPreviewingIntensity(intensity);
    
    // Apply the preview intensity temporarily
    const root = document.documentElement;
    const intensityMap: { [key: string]: number } = {
      'light': 0.03,
      'medium': 0.08,
      'heavy': 0.15,
      'extra-heavy': 0.25,
      'maximum': 0.4
    };
    
    const value = intensityMap[intensity];
    if (value !== undefined) {
      root.style.setProperty('--scanline-intensity', value.toString());
    }
    
    // Reset after 2 seconds
    setTimeout(() => {
      setPreviewingIntensity(null);
      // Restore saved intensity
      root.style.setProperty('--scanline-intensity', preferences.customIntensity.toString());
    }, 2000);
  };

  const handleDensityChange = (value: number[]) => {
    const newDensity = value[0];
    setPreviewDensity(newDensity);
    
    // Apply immediately for live preview
    const root = document.documentElement;
    root.style.setProperty('--scanline-density', `${newDensity}px`);
  };

  const handleDensityCommit = () => {
    if (previewDensity !== null) {
      setDensity(previewDensity);
      setPreviewDensity(null);
    }
  };

  const customIntensityPercent = Math.round(preferences.customIntensity * 100);

  return (
    <div className="flex flex-col h-full bg-[var(--mac-window)] text-[var(--mac-text)]">
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-[var(--mac-border)]">
              <th className="text-left p-2 font-bold">Setting</th>
              <th className="text-left p-2 font-bold">Value</th>
              <th className="text-center p-2 font-bold">Enabled</th>
              <th className="text-center p-2 font-bold">Preview</th>
            </tr>
          </thead>
          <tbody>
            {/* Master Toggle */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2 font-semibold">Master Toggle</td>
              <td className="p-2">—</td>
              <td className="p-2">
                <RadioGroup
                  value={preferences.enabled ? 'on' : 'off'}
                  onValueChange={(value) => toggleScanlines(value === 'on')}
                  className="flex gap-4 justify-center"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="on" id="master-on" />
                    <Label htmlFor="master-on">On</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="off" id="master-off" />
                    <Label htmlFor="master-off">Off</Label>
                  </div>
                </RadioGroup>
              </td>
              <td className="p-2">—</td>
            </tr>

            {/* Light */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Light</td>
              <td className="p-2 text-muted-foreground">3%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => setIntensity(value as any)}
                  className="justify-center"
                >
                  <RadioGroupItem value="light" id="intensity-light" />
                </RadioGroup>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handlePreview('light')}
                  disabled={previewingIntensity === 'light'}
                  className="px-3 py-1 text-sm border border-[var(--mac-border)] hover:bg-[var(--mac-selected)] disabled:opacity-50"
                >
                  {previewingIntensity === 'light' ? 'Previewing...' : 'Preview'}
                </button>
              </td>
            </tr>

            {/* Medium */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Medium</td>
              <td className="p-2 text-muted-foreground">5%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => setIntensity(value as any)}
                  className="justify-center"
                >
                  <RadioGroupItem value="medium" id="intensity-medium" />
                </RadioGroup>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handlePreview('medium')}
                  disabled={previewingIntensity === 'medium'}
                  className="px-3 py-1 text-sm border border-[var(--mac-border)] hover:bg-[var(--mac-selected)] disabled:opacity-50"
                >
                  {previewingIntensity === 'medium' ? 'Previewing...' : 'Preview'}
                </button>
              </td>
            </tr>

            {/* Heavy */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Heavy</td>
              <td className="p-2 text-muted-foreground">8%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => setIntensity(value as any)}
                  className="justify-center"
                >
                  <RadioGroupItem value="heavy" id="intensity-heavy" />
                </RadioGroup>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handlePreview('heavy')}
                  disabled={previewingIntensity === 'heavy'}
                  className="px-3 py-1 text-sm border border-[var(--mac-border)] hover:bg-[var(--mac-selected)] disabled:opacity-50"
                >
                  {previewingIntensity === 'heavy' ? 'Previewing...' : 'Preview'}
                </button>
              </td>
            </tr>

            {/* Extra Heavy */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Extra Heavy</td>
              <td className="p-2 text-muted-foreground">12%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => setIntensity(value as any)}
                  className="justify-center"
                >
                  <RadioGroupItem value="extra-heavy" id="intensity-extra-heavy" />
                </RadioGroup>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handlePreview('extra-heavy')}
                  disabled={previewingIntensity === 'extra-heavy'}
                  className="px-3 py-1 text-sm border border-[var(--mac-border)] hover:bg-[var(--mac-selected)] disabled:opacity-50"
                >
                  {previewingIntensity === 'extra-heavy' ? 'Previewing...' : 'Preview'}
                </button>
              </td>
            </tr>

            {/* Maximum */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Maximum</td>
              <td className="p-2 text-muted-foreground">15%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => setIntensity(value as any)}
                  className="justify-center"
                >
                  <RadioGroupItem value="maximum" id="intensity-maximum" />
                </RadioGroup>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handlePreview('maximum')}
                  disabled={previewingIntensity === 'maximum'}
                  className="px-3 py-1 text-sm border border-[var(--mac-border)] hover:bg-[var(--mac-selected)] disabled:opacity-50"
                >
                  {previewingIntensity === 'maximum' ? 'Previewing...' : 'Preview'}
                </button>
              </td>
            </tr>

            {/* Custom */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Custom</td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[customIntensityPercent]}
                    onValueChange={(value) => setCustomIntensity(value[0] / 100)}
                    min={0}
                    max={20}
                    step={1}
                    disabled={preferences.intensity !== 'custom'}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{customIntensityPercent}%</span>
                </div>
              </td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => setIntensity(value as any)}
                  className="justify-center"
                >
                  <RadioGroupItem value="custom" id="intensity-custom" />
                </RadioGroup>
              </td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handlePreview('custom')}
                  disabled={previewingIntensity === 'custom'}
                  className="px-3 py-1 text-sm border border-[var(--mac-border)] hover:bg-[var(--mac-selected)] disabled:opacity-50"
                >
                  {previewingIntensity === 'custom' ? 'Previewing...' : 'Preview'}
                </button>
              </td>
            </tr>

            {/* Density */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2 font-semibold">Density</td>
              <td className="p-2" colSpan={3}>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Dense</span>
                  <Slider
                    value={[previewDensity ?? preferences.density]}
                    onValueChange={handleDensityChange}
                    onValueCommit={handleDensityCommit}
                    min={1}
                    max={4}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">Very Wide</span>
                  <span className="text-sm w-8">{(previewDensity ?? preferences.density).toFixed(1)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
