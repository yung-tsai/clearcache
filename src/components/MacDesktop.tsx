import { useState, useEffect } from 'react';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import { DesktopIcons } from './DesktopIcons';
import JournalEditor from './JournalEditor';
import JournalFolder from './JournalFolder';
import JournalCalendar from './JournalCalendar';
import StreakDisplay from './StreakDisplay';
import { Settings } from './Settings';
import { WelcomeScreen } from './WelcomeScreen';
import { useAuth } from '@/hooks/useAuth';
import { BackgroundPreference } from './BackgroundSelector';
import swatchPattern from '@/assets/swatch-pattern.png';
import dotsPattern from '@/assets/pattern-dots.png';
import linesPattern from '@/assets/pattern-lines.png';
import gridPattern from '@/assets/pattern-grid.png';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder' | 'edit-entry' | 'journal-calendar' | 'streaks' | 'settings' | 'welcome';

interface OpenWindow {
  id: string;
  content: WindowContent;
  title: string;
  entryId?: string;
  zIndex: number;
  noPadding?: boolean;
}

const patternMap: Record<string, string> = {
  swatch: swatchPattern,
  dots: dotsPattern,
  lines: linesPattern,
  grid: gridPattern,
};

export function MacDesktop() {
  const { profile } = useAuth();
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [previewStyle, setPreviewStyle] = useState<React.CSSProperties | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

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
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'new-entry',
          title: 'New Entry',
          zIndex: newZIndex
        }]);
        break;
      case 'journal-folder':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'journal-folder',
          title: 'Journal Folder',
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
    }
  };

  const handleOpenEntry = (entryId: string, title: string) => {
    // Check for existing edit-entry window (single instance for all entries)
    const existingEditWindow = windows.find(w => w.content === 'edit-entry');
    if (existingEditWindow) {
      // Update existing window with new entry and bring to front
      setWindows(prev => prev.map(w => 
        w.id === existingEditWindow.id 
          ? { ...w, entryId, title: title || 'Edit Entry', zIndex: nextZIndex }
          : w
      ));
      setNextZIndex(prev => prev + 1);
      return;
    }

    const windowId = Date.now().toString();
    const newZIndex = nextZIndex;
    setNextZIndex(prev => prev + 1);
    
    setWindows(prev => [...prev, {
      id: windowId,
      content: 'edit-entry',
      title: title || 'Edit Entry',
      entryId,
      zIndex: newZIndex
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
        ? { ...w, title: title || 'Edit Entry' }
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
        return <JournalEditor onEntryCreated={(entryId, title) => {
          handleEntryCreated(window.id, entryId, title);
        }} />;
      case 'journal-folder':
        return <JournalFolder onOpenEntry={handleOpenEntry} />;
      case 'edit-entry':
        return <JournalEditor 
          entryId={window.entryId} 
          onDelete={() => handleEntryDeleted(window.id)}
          onTitleUpdate={(title) => handleTitleUpdate(window.id, title)}
        />;
      case 'journal-calendar':
        return <JournalCalendar onOpenEntry={(entryId) => {
          handleOpenEntry(entryId, 'Edit Entry');
        }} />;
      case 'streaks':
        return <StreakDisplay />;
      case 'settings':
        return <Settings />;
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
      
      <MacMenuBar onMenuAction={handleMenuAction} />
      
      <div className="relative h-full pt-6">
        {/* Welcome Screen */}
        {showWelcome && (
          <MacWindow
            title="WELCOME TO"
            initialX={window.innerWidth / 2 - 365}
            initialY={window.innerHeight / 2 - 215}
            initialWidth={730}
            initialHeight={430}
            zIndex={1000}
            hideControls={true}
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

        {windows.map((window, index) => (
          <MacWindow
            key={window.id}
            title={window.title}
            onClose={() => handleCloseWindow(window.id)}
            onClick={() => bringWindowToFront(window.id)}
            initialX={100 + (index * 30)}
            initialY={100 + (index * 30)}
            initialWidth={800}
            initialHeight={600}
            zIndex={window.zIndex}
            noPadding={window.noPadding}
          >
            {renderWindowContent(window)}
          </MacWindow>
        ))}
        
        {/* Desktop Icons */}
        <DesktopIcons onIconAction={handleMenuAction} />
      </div>
    </div>
  );
}