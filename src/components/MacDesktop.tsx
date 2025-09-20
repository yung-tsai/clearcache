import { useState, useEffect } from 'react';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import JournalEditor from './JournalEditor';
import JournalFolder from './JournalFolder';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder' | 'edit-entry';
export type BackgroundType = 'small-dots' | 'big-dots' | 'black';

interface OpenWindow {
  id: string;
  content: WindowContent;
  title: string;
  entryId?: string;
}

export function MacDesktop() {
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(() => {
    const saved = localStorage.getItem('mac-desktop-background');
    return (saved as BackgroundType) || 'small-dots';
  });

  useEffect(() => {
    localStorage.setItem('mac-desktop-background', backgroundType);
  }, [backgroundType]);

  const handleMenuAction = (action: string) => {
    const windowId = Date.now().toString();
    
    // Handle background changes
    if (action.startsWith('background-')) {
      const bgType = action.replace('background-', '') as BackgroundType;
      setBackgroundType(bgType);
      return;
    }
    
    switch (action) {
      case 'new-entry':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'new-entry',
          title: 'New Entry'
        }]);
        break;
      case 'journal-folder':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'journal-folder',
          title: 'Journal Folder'
        }]);
        break;
    }
  };

  const handleOpenEntry = (entryId: string, title: string) => {
    const windowId = Date.now().toString();
    setWindows(prev => [...prev, {
      id: windowId,
      content: 'edit-entry',
      title: title || 'Edit Entry',
      entryId
    }]);
  };

  const handleCloseWindow = (windowId: string) => {
    setWindows(prev => prev.filter(w => w.id !== windowId));
  };

  const renderWindowContent = (window: OpenWindow) => {
    switch (window.content) {
      case 'new-entry':
        return <JournalEditor />;
      case 'journal-folder':
        return <JournalFolder onOpenEntry={handleOpenEntry} />;
      case 'edit-entry':
        return <JournalEditor entryId={window.entryId} />;
      default:
        return null;
    }
  };

  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case 'black':
        return { backgroundColor: '#000000' };
      case 'big-dots':
        return { 
          backgroundImage: 'url("/src/assets/swatch-big-dots.png")',
          backgroundRepeat: 'repeat'
        };
      case 'small-dots':
      default:
        return { 
          backgroundImage: 'url("/src/assets/swatch-pattern.png")',
          backgroundRepeat: 'repeat'
        };
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden" style={getBackgroundStyle()}>
      <MacMenuBar onMenuAction={handleMenuAction} currentBackground={backgroundType} />
      
      <div className="relative h-full pt-6">
        {windows.map((window, index) => (
          <MacWindow
            key={window.id}
            title={window.title}
            onClose={() => handleCloseWindow(window.id)}
            initialX={100 + (index * 30)}
            initialY={100 + (index * 30)}
            initialWidth={800}
            initialHeight={600}
          >
            {renderWindowContent(window)}
          </MacWindow>
        ))}
      </div>
    </div>
  );
}