import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import { DesktopIcons } from './DesktopIcons';
import JournalEditor from './JournalEditor';
import JournalFolder from './JournalFolder';
import JournalCalendar from './JournalCalendar';
import StreakDisplay from './StreakDisplay';
import { Settings } from './Settings';
import { ScanlineSettings } from './ScanlineSettings';
import { WelcomeScreen } from './WelcomeScreen';
import { useAuth } from '@/hooks/useAuth';
import { useScanlineSettings, INTENSITY_MAP } from '@/hooks/useScanlineSettings';
import { BackgroundPreference } from './BackgroundSelector';
import swatchPattern from '@/assets/swatch-pattern.png';
import dotsPattern from '@/assets/pattern-dots.png';
import linesPattern from '@/assets/pattern-lines.png';
import gridPattern from '@/assets/pattern-grid.png';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder' | 'edit-entry' | 'journal-calendar' | 'streaks' | 'settings' | 'scanlines' | 'welcome';

interface OpenWindow {
  id: string;
  content: WindowContent;
  title: string;
  entryId?: string;
  zIndex: number;
  noPadding?: boolean;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
}

const patternMap: Record<string, string> = {
  swatch: swatchPattern,
  dots: dotsPattern,
  lines: linesPattern,
  grid: gridPattern,
};

export function MacDesktop() {
  const { profile } = useAuth();
  const { preferences: scanlinePrefs } = useScanlineSettings();
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [windowInfoBars, setWindowInfoBars] = useState<Record<string, { createdAt: string; wordCount: number }>>({});

  // Helper to format dates for info bar
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'EEE, MMM d, yyyy');
  };

  // Helper to calculate centered position with offset
  const getCenteredPosition = (windowWidth: number, windowHeight: number, offset: number = 0) => {
    return {
      x: (window.innerWidth / 2) - (windowWidth / 2) + offset,
      y: (window.innerHeight / 2) - (windowHeight / 2) + offset
    };
  };

  // Load and apply background preference
  useEffect(() => {
    if (profile?.background_preference) {
      const pref = profile.background_preference as BackgroundPreference;
      console.log('Applying background from profile:', pref);
      applyBackground(pref);
    } else {
      console.log('No background preference in profile, using default');
    }
  }, [profile]);

  // Apply scanline preferences
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--scanline-enabled', scanlinePrefs.enabled ? '1' : '0');
    
    let intensity = scanlinePrefs.customIntensity;
    if (scanlinePrefs.intensity !== 'custom') {
      intensity = INTENSITY_MAP[scanlinePrefs.intensity];
    }
    root.style.setProperty('--scanline-intensity', intensity.toString());
    root.style.setProperty('--scanline-density', `${scanlinePrefs.density}px`);
  }, [scanlinePrefs]);

  // Listen for scanline changes from settings window
  useEffect(() => {
    const handleScanlineChange = (e: any) => {
      const prefs = e.detail;
      const root = document.documentElement;
      root.style.setProperty('--scanline-enabled', prefs.enabled ? '1' : '0');
      const intensity = prefs.intensity === 'custom'
        ? prefs.customIntensity
        : INTENSITY_MAP[prefs.intensity];
      root.style.setProperty('--scanline-intensity', intensity.toString());
      root.style.setProperty('--scanline-density', `${prefs.density}px`);
    };
    window.addEventListener('scanline-change', handleScanlineChange as any);
    return () => window.removeEventListener('scanline-change', handleScanlineChange as any);
  }, []);

  // Listen for background changes
  useEffect(() => {
    const handleBackgroundChange = (e: CustomEvent<BackgroundPreference>) => {
      applyBackground(e.detail);
    };

    const handleBackgroundPreview = (e: CustomEvent<BackgroundPreference | null>) => {
      if (e.detail) {
        setPreviewStyle(getBackgroundStyle(e.detail));
      } else {
        setPreviewStyle(null);
      }
    };

    window.addEventListener('background-change' as any, handleBackgroundChange);
    window.addEventListener('background-preview' as any, handleBackgroundPreview);

    return () => {
      window.removeEventListener('background-change' as any, handleBackgroundChange);
      window.removeEventListener('background-preview' as any, handleBackgroundPreview);
    };
  }, []);

  const getBackgroundStyle = (pref: BackgroundPreference): React.CSSProperties => {
    if (pref.type === 'color') {
      return { backgroundColor: pref.value };
    } else {
      const patternImage = patternMap[pref.value];
      return {
        backgroundImage: `url(${patternImage})`,
        backgroundSize: pref.value === 'swatch' ? 'auto' : '150px',
        backgroundRepeat: 'repeat',
      };
    }
  };

  const applyBackground = (pref: BackgroundPreference) => {
    setBackgroundStyle(getBackgroundStyle(pref));
  };

  const handleMenuAction = (action: string) => {
    const windowId = Date.now().toString();
    
    // Check for existing windows of the same type (single instance)
    const existingWindow = windows.find(w => w.content === action);
    if (existingWindow) {
      // Bring existing window to front instead of creating new one
      bringWindowToFront(existingWindow.id);
      return;
    }
    
    const newZIndex = nextZIndex;
    setNextZIndex(prev => prev + 1);
    
    switch (action) {
      case 'new-entry':
        const newEntryCount = windows.filter(w => w.content === 'new-entry' || w.content === 'edit-entry').length;
        const offset = newEntryCount * 20; // 20px offset for each additional window
        const centerPos = getCenteredPosition(800, 600, offset);
        
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'new-entry',
          title: 'New Entry',
          zIndex: newZIndex,
          initialX: centerPos.x,
          initialY: centerPos.y,
          width: 800,
          height: 600
        }]);
        break;
      case 'journal-folder':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'journal-folder',
          title: 'Entries',
          zIndex: newZIndex,
          noPadding: true
        }]);
        break;
      case 'journal-calendar':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'journal-calendar',
          title: 'Calendar',
          zIndex: newZIndex
        }]);
        break;
      case 'streaks':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'streaks',
          title: 'Streaks',
          zIndex: newZIndex
        }]);
        break;
      case 'settings':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'settings',
          title: 'Settings',
          zIndex: newZIndex
        }]);
        break;
      case 'scanlines':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'scanlines',
          title: 'Scanlines',
          zIndex: newZIndex
        }]);
        break;
    }
  };

  const handleOpenEntry = (entryId: string, title: string) => {
    // Check for existing edit-entry window (single instance for all entries)
    const existingEditWindow = windows.find(w => w.content === 'edit-entry');
    if (existingEditWindow) {
      // Update existing window with new entry and bring to front
      setWindows(prev => prev.map(w => 
        w.id === existingEditWindow.id 
          ? { ...w, entryId, title: title || 'Untitled', zIndex: nextZIndex }
          : w
      ));
      setNextZIndex(prev => prev + 1);
      return;
    }

    const windowId = Date.now().toString();
    const newZIndex = nextZIndex;
    setNextZIndex(prev => prev + 1);
    
    const editCount = windows.filter(w => w.content === 'edit-entry' || w.content === 'new-entry').length;
    const offset = editCount * 20;
    const centerPos = getCenteredPosition(800, 600, offset);
    
    setWindows(prev => [...prev, {
      id: windowId,
      content: 'edit-entry',
      title: title || 'Untitled',
      entryId,
      zIndex: newZIndex,
      initialX: centerPos.x,
      initialY: centerPos.y,
      width: 800,
      height: 600
    }]);
  };

  const handleCloseWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  };

  const bringWindowToFront = (windowId: string) => {
    const newZIndex = nextZIndex;
    setNextZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, zIndex: newZIndex }
        : w
    ));
  };

  const handleEntryCreated = (windowId: string, entryId: string, title: string) => {
    // Convert the new-entry window to an edit-entry window
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, content: 'edit-entry', title: title || 'Edit Entry', entryId }
        : w
    ));
    // Refresh journal folder windows to show the new entry
    setWindows(prev => prev.map(w => 
      w.content === 'journal-folder' 
        ? { ...w, id: w.id + '-refreshed-' + Date.now() }
        : w
    ));
  };

  const handleTitleUpdate = (windowId: string, title: string) => {
    // Update the window title when entry title changes
    setWindows(prev => prev.map(w => 
      w.id === windowId 
        ? { ...w, title: title || 'Untitled' }
        : w
    ));
    // Refresh journal folder windows to show updated titles
    setWindows(prev => prev.map(w => 
      w.content === 'journal-folder' 
        ? { ...w, id: w.id + '-refreshed-' + Date.now() }
        : w
    ));
  };

  const handleEntryDeleted = (windowId: string) => {
    // Close the editor window
    handleCloseWindow(windowId);
    // Trigger a refresh of any journal folder windows by updating their key
    setWindows(prev => prev.map(w => 
      w.content === 'journal-folder' 
        ? { ...w, id: w.id + '-refreshed-' + Date.now() }
        : w
    ));
  };

  const renderWindowContent = (window: OpenWindow) => {
    switch (window.content) {
      case 'welcome':
        return <WelcomeScreen 
          onEnter={() => setShowWelcome(false)} 
          onOpenNewEntry={() => {
            setShowWelcome(false);
            handleMenuAction('new-entry');
          }}
        />;
      case 'new-entry':
        return <JournalEditor 
          onEntryCreated={(entryId, title) => {
            handleEntryCreated(window.id, entryId, title);
          }}
          onInfoChange={(info) => {
            setWindowInfoBars(prev => ({
              ...prev,
              [window.id]: info
            }));
          }}
        />;
      case 'journal-folder':
        return <JournalFolder onOpenEntry={handleOpenEntry} />;
      case 'edit-entry':
        return <JournalEditor 
          entryId={window.entryId} 
          onDelete={() => handleEntryDeleted(window.id)}
          onTitleUpdate={(title) => handleTitleUpdate(window.id, title)}
          onInfoChange={(info) => {
            setWindowInfoBars(prev => ({
              ...prev,
              [window.id]: info
            }));
          }}
        />;
      case 'journal-calendar':
        return <JournalCalendar onOpenEntry={(entryId) => {
          handleOpenEntry(entryId, 'Untitled');
        }} />;
      case 'streaks':
        return <StreakDisplay />;
      case 'settings':
        return <Settings />;
      case 'scanlines':
        return <ScanlineSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-mac-desktop">
      {/* Mac-style textured background with user preference */}
      <div 
        className="absolute inset-0 transition-all duration-300" 
        style={previewStyle || backgroundStyle}
      />
      
      {/* CRT Scanlines Overlay */}
      <div className="crt-scanlines" />
      
      <MacMenuBar onMenuAction={handleMenuAction} />
      
      <div className="relative h-full pt-6">
        {/* Welcome Screen */}
        {showWelcome && (
          <MacWindow
            title="Clear Cache"
            initialX={window.innerWidth / 2 - 365}
            initialY={window.innerHeight / 2 - 215}
            initialWidth={730}
            initialHeight={430}
            zIndex={1000}
            hideTitleBar={true}
          >
            <WelcomeScreen 
              onEnter={() => setShowWelcome(false)} 
              onOpenNewEntry={() => {
                setShowWelcome(false);
                handleMenuAction('new-entry');
              }}
            />
          </MacWindow>
        )}

        {windows.map((window, index) => {
          const windowInfo = windowInfoBars[window.id];
          const showInfoBar = (window.content === 'new-entry' || window.content === 'edit-entry');
          
          return (
            <MacWindow
              key={window.id}
              title={window.title}
              onClose={() => handleCloseWindow(window.id)}
              onClick={() => bringWindowToFront(window.id)}
              initialX={window.initialX ?? (100 + (index * 30))}
              initialY={window.initialY ?? (100 + (index * 30))}
              initialWidth={window.width ?? 800}
              initialHeight={window.height ?? 600}
              zIndex={window.zIndex}
              noPadding={window.noPadding}
              showInfoBar={showInfoBar}
              infoBarLeft={windowInfo ? formatDate(windowInfo.createdAt) : ''}
              infoBarRight={windowInfo ? `Word Count: ${windowInfo.wordCount}` : 'Word Count: 0'}
            >
              {renderWindowContent(window)}
            </MacWindow>
          );
        })}
        
        {/* Desktop Icons */}
        <DesktopIcons onIconAction={handleMenuAction} />
      </div>
    </div>
  );
}