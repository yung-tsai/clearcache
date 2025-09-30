import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import { DesktopIcons } from './DesktopIcons';
import JournalFolder from './JournalFolder';
import JournalCalendar from './JournalCalendar';
import StreakDisplay from './StreakDisplay';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder' | 'edit-entry' | 'journal-calendar' | 'streaks';

interface OpenWindow {
  id: string;
  content: WindowContent;
  title: string;
  entryId?: string;
  zIndex: number;
}

export function MacDesktop() {
  const navigate = useNavigate();
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextZIndex, setNextZIndex] = useState(100);

  const handleMenuAction = (action: string) => {
    // For new-entry, navigate directly to the page
    if (action === 'new-entry') {
      navigate('/app/new');
      return;
    }
    
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
      case 'journal-folder':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'journal-folder',
          title: 'Journal Folder',
          zIndex: newZIndex
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
          title: 'Journal Streaks',
          zIndex: newZIndex
        }]);
        break;
    }
  };

  const handleOpenEntry = (entryId: string, title?: string) => {
    // Navigate directly to the edit entry page
    navigate(`/app/entry/${entryId}`);
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

  const renderWindowContent = (win: OpenWindow) => {
    switch (win.content) {
      case 'journal-folder':
        return <JournalFolder onOpenEntry={handleOpenEntry} />;
      case 'journal-calendar':
        return <JournalCalendar onOpenEntry={handleOpenEntry} />;
      case 'streaks':
        return <StreakDisplay />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-mac-desktop">
      {/* Mac-style textured background */}
      <div className="absolute inset-0 opacity-30 bg-repeat bg-mac-texture" />
      
      <MacMenuBar onMenuAction={handleMenuAction} />
      
      <div className="relative h-full pt-6">
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