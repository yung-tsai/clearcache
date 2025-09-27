import { useState } from 'react';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import { MacDock } from './MacDock';
import JournalEditor from './JournalEditor';
import JournalFolder from './JournalFolder';
import JournalCalendar from './JournalCalendar';
import StreakCounter from './StreakCounter';
import BadgeDisplay from './BadgeDisplay';
import BadgeNotification from './BadgeNotification';
import TestingUtils from './TestingUtils';
import { useRefreshStreaks } from '@/hooks/useStreaks';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder' | 'edit-entry' | 'journal-calendar' | 'streaks' | 'achievements' | 'testing';

interface OpenWindow {
  id: string;
  content: WindowContent;
  title: string;
  entryId?: string;
}

export function MacDesktop() {
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const refreshStreaks = useRefreshStreaks();

  const handleMenuAction = (action: string) => {
    // Check if a window with this content type already exists
    const existingWindowIndex = windows.findIndex(window => {
      switch (action) {
        case 'new-entry':
          return window.content === 'new-entry';
        case 'journal-folder':
          return window.content === 'journal-folder';
        case 'journal-calendar':
          return window.content === 'journal-calendar';
        case 'streaks':
          return window.content === 'streaks';
        case 'achievements':
          return window.content === 'achievements';
        case 'testing':
          return window.content === 'testing';
        default:
          return false;
      }
    });

    // If window already exists, bring it to front
    if (existingWindowIndex !== -1) {
      const existingWindow = windows[existingWindowIndex];
      setWindows(prev => [
        ...prev.filter((_, index) => index !== existingWindowIndex),
        existingWindow
      ]);
      return;
    }

    // Create new window if it doesn't exist
    const windowId = Date.now().toString();
    
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
      case 'journal-calendar':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'journal-calendar',
          title: 'Calendar'
        }]);
        break;
      case 'streaks':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'streaks',
          title: 'Writing Streaks'
        }]);
        break;
      case 'achievements':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'achievements',
          title: 'Achievements'
        }]);
        break;
      case 'testing':
        setWindows(prev => [...prev, {
          id: windowId,
          content: 'testing',
          title: 'Testing Utils'
        }]);
        break;
    }
  };

  const handleOpenEntry = (entryId: string, title: string) => {
    // Edit entries can have multiple instances, so always create new window
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

  const handleEntryCreated = (windowId: string, entryId: string, title: string) => {
    // Refresh streaks when a new entry is created
    refreshStreaks();
    
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

  const handleBringToFront = (windowId: string) => {
    setWindows(prev => {
      const windowIndex = prev.findIndex(w => w.id === windowId);
      if (windowIndex === -1 || windowIndex === prev.length - 1) return prev;
      
      const window = prev[windowIndex];
      return [
        ...prev.filter((_, index) => index !== windowIndex),
        window
      ];
    });
  };

  const renderWindowContent = (window: OpenWindow) => {
    switch (window.content) {
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
        return (
          <div className="p-6 flex justify-center items-start">
            <StreakCounter />
          </div>
        );
      case 'achievements':
        return (
          <div className="p-6">
            <BadgeDisplay />
          </div>
        );
      case 'testing':
        return (
          <div className="p-6 flex justify-center items-start">
            <TestingUtils />
          </div>
        );
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
            onFocus={() => handleBringToFront(window.id)}
            initialX={100 + (index * 30)}
            initialY={100 + (index * 30)}
            initialWidth={800}
            initialHeight={600}
          >
            {renderWindowContent(window)}
          </MacWindow>
        ))}
        
        {/* Modern macOS Dock */}
        <MacDock onDockAction={handleMenuAction} />
      </div>
      
      {/* Badge notification system */}
      <BadgeNotification />
    </div>
  );
}