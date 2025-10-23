
import { useScanlineSettings, INTENSITY_MAP } from '@/hooks/useScanlineSettings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function ScanlineSettings() {
  const { preferences, loading, toggleScanlines, setIntensity, setDensity, setCustomIntensity } = useScanlineSettings();

  if (loading) {
    return <div className="p-4">Loading scanline settings...</div>;
  }

  const handleDensityChange = (value: number[]) => {
    const newDensity = value[0];
    const root = document.documentElement;
    root.style.setProperty('--scanline-density', `${newDensity}px`);
    setDensity(newDensity);
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
                  onValueChange={(value) => {
                    const enabled = value === 'on';
                    toggleScanlines(enabled);
                    document.documentElement.style.setProperty('--scanline-enabled', enabled ? '1' : '0');
                  }}
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
            </tr>

            {/* Light */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Light</td>
              <td className="p-2 text-muted-foreground">3%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => {
                    setIntensity(value as any);
                    const intensity = value === 'custom' ? preferences.customIntensity : INTENSITY_MAP[value as keyof typeof INTENSITY_MAP];
                    document.documentElement.style.setProperty('--scanline-intensity', intensity.toString());
                  }}
                  className="justify-center"
                >
                  <RadioGroupItem value="light" id="intensity-light" />
                </RadioGroup>
              </td>
            </tr>

            {/* Medium */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Medium</td>
              <td className="p-2 text-muted-foreground">5%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => {
                    setIntensity(value as any);
                    const intensity = value === 'custom' ? preferences.customIntensity : INTENSITY_MAP[value as keyof typeof INTENSITY_MAP];
                    document.documentElement.style.setProperty('--scanline-intensity', intensity.toString());
                  }}
                  className="justify-center"
                >
                  <RadioGroupItem value="medium" id="intensity-medium" />
                </RadioGroup>
              </td>
            </tr>

            {/* Heavy */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Heavy</td>
              <td className="p-2 text-muted-foreground">8%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => {
                    setIntensity(value as any);
                    const intensity = value === 'custom' ? preferences.customIntensity : INTENSITY_MAP[value as keyof typeof INTENSITY_MAP];
                    document.documentElement.style.setProperty('--scanline-intensity', intensity.toString());
                  }}
                  className="justify-center"
                >
                  <RadioGroupItem value="heavy" id="intensity-heavy" />
                </RadioGroup>
              </td>
            </tr>

            {/* Extra Heavy */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Extra Heavy</td>
              <td className="p-2 text-muted-foreground">12%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => {
                    setIntensity(value as any);
                    const intensity = value === 'custom' ? preferences.customIntensity : INTENSITY_MAP[value as keyof typeof INTENSITY_MAP];
                    document.documentElement.style.setProperty('--scanline-intensity', intensity.toString());
                  }}
                  className="justify-center"
                >
                  <RadioGroupItem value="extra-heavy" id="intensity-extra-heavy" />
                </RadioGroup>
              </td>
            </tr>

            {/* Maximum */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Maximum</td>
              <td className="p-2 text-muted-foreground">15%</td>
              <td className="p-2 text-center">
                <RadioGroup
                  value={preferences.intensity}
                  onValueChange={(value) => {
                    setIntensity(value as any);
                    const intensity = value === 'custom' ? preferences.customIntensity : INTENSITY_MAP[value as keyof typeof INTENSITY_MAP];
                    document.documentElement.style.setProperty('--scanline-intensity', intensity.toString());
                  }}
                  className="justify-center"
                >
                  <RadioGroupItem value="maximum" id="intensity-maximum" />
                </RadioGroup>
              </td>
            </tr>

            {/* Custom */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2">Custom</td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[customIntensityPercent]}
                    onValueChange={(value) => {
                      const newIntensity = value[0] / 100;
                      setCustomIntensity(newIntensity);
                      if (preferences.intensity === 'custom') {
                        document.documentElement.style.setProperty('--scanline-intensity', newIntensity.toString());
                      }
                    }}
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
                  onValueChange={(value) => {
                    setIntensity(value as any);
                    const intensity = value === 'custom' ? preferences.customIntensity : INTENSITY_MAP[value as keyof typeof INTENSITY_MAP];
                    document.documentElement.style.setProperty('--scanline-intensity', intensity.toString());
                  }}
                  className="justify-center"
                >
                  <RadioGroupItem value="custom" id="intensity-custom" />
                </RadioGroup>
              </td>
            </tr>

            {/* Density */}
            <tr className="border-b border-[var(--mac-border)]">
              <td className="p-2 font-semibold">Density</td>
              <td className="p-2" colSpan={2}>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Dense</span>
                  <Slider
                    value={[preferences.density]}
                    onValueChange={handleDensityChange}
                    min={1}
                    max={4}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">Very Wide</span>
                  <span className="text-sm w-8">{preferences.density.toFixed(1)}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
