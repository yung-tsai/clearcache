import { useState } from 'react';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import JournalEditor from './JournalEditor';
import JournalFolder from './JournalFolder';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder' | 'edit-entry';

interface OpenWindow {
  id: string;
  content: WindowContent;
  title: string;
  entryId?: string;
}

export function MacDesktop() {
  const [windows, setWindows] = useState<OpenWindow[]>([]);

  const handleMenuAction = (action: string) => {
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
      case 'new-entry':
        return <JournalEditor />;
      case 'journal-folder':
        return <JournalFolder onOpenEntry={handleOpenEntry} />;
      case 'edit-entry':
        return <JournalEditor entryId={window.entryId} onDelete={() => handleEntryDeleted(window.id)} />;
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