import { Slider } from '@/components/ui/slider';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export function Settings() {
  const { preferences, loading, setMasterVolume, toggleSound } = useSoundSettings();
  const { playSound } = useSoundEffects();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="font-chicago text-sm">Loading settings...</p>
      </div>
    );
  }

  const soundSettings = [
    { key: 'windowClose' as const, label: 'Window Close', testSound: 'windowClose' as const },
    { key: 'keyboard' as const, label: 'Keyboard Sounds', testSound: 'keyPress' as const },
    { key: 'login' as const, label: 'Login Sound', testSound: 'login' as const },
    { key: 'notification' as const, label: 'Notifications', testSound: 'notification' as const },
    { key: 'newEntry' as const, label: 'New Entry', testSound: 'newEntry' as const },
  ];

  return (
    <div className="p-8">
      <h2 className="font-chicago text-lg mb-6">Settings</h2>
      
      <div className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <table className="w-full font-chicago text-sm">
          <thead>
            <tr className="border-b border-black bg-gray-50">
              <th className="text-left p-3 font-medium">Sound Type</th>
              <th className="text-left p-3 font-medium w-64">Volume</th>
              <th className="text-left p-3 font-medium">Enabled</th>
              <th className="text-left p-3 font-medium">Test</th>
            </tr>
          </thead>
          <tbody>
            {/* Master Volume Row */}
            <tr className="border-b border-black bg-blue-50">
              <td className="p-3 font-medium">Master Volume</td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <Slider
                    value={[preferences.masterVolume * 100]}
                    onValueChange={([value]) => setMasterVolume(value / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs w-10 text-right">
                    {Math.round(preferences.masterVolume * 100)}%
                  </span>
                </div>
              </td>
              <td className="p-3">—</td>
              <td className="p-3">—</td>
            </tr>

            {/* Individual Sound Rows */}
            {soundSettings.map((setting) => (
              <tr key={setting.key} className="border-b border-black last:border-b-0">
                <td className="p-3">{setting.label}</td>
                <td className="p-3">—</td>
                <td className="p-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`sound-${setting.key}`}
                        checked={preferences.sounds[setting.key].enabled}
                        onChange={() => toggleSound(setting.key, true)}
                        className="w-4 h-4"
                      />
                      <span>On</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`sound-${setting.key}`}
                        checked={!preferences.sounds[setting.key].enabled}
                        onChange={() => toggleSound(setting.key, false)}
                        className="w-4 h-4"
                      />
                      <span>Off</span>
                    </label>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => playSound(setting.testSound)}
                    className="px-3 py-1 bg-white border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-chicago text-xs"
                  >
                    Test
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs font-chicago text-gray-600">
        Changes are saved automatically.
      </p>
    </div>
  );
}
