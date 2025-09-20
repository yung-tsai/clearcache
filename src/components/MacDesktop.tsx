import { useState } from 'react';
import { MacMenuBar } from './MacMenuBar';
import { MacWindow } from './MacWindow';
import JournalEditor from './JournalEditor';
import JournalFolder from './JournalFolder';

export type WindowContent = 'none' | 'new-entry' | 'journal-folder';

export function MacDesktop() {
  const [windowContent, setWindowContent] = useState<WindowContent>('none');
  const [isWindowVisible, setIsWindowVisible] = useState(false);

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'new-entry':
        setWindowContent('new-entry');
        setIsWindowVisible(true);
        break;
      case 'journal-folder':
        setWindowContent('journal-folder');
        setIsWindowVisible(true);
        break;
    }
  };

  const handleCloseWindow = () => {
    setIsWindowVisible(false);
    setWindowContent('none');
  };

  const getWindowTitle = () => {
    switch (windowContent) {
      case 'new-entry':
        return 'New Entry';
      case 'journal-folder':
        return 'Journal Folder';
      default:
        return 'Window';
    }
  };

  const renderWindowContent = () => {
    switch (windowContent) {
      case 'new-entry':
        return <JournalEditor />;
      case 'journal-folder':
        return <JournalFolder />;
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
        {isWindowVisible && (
          <MacWindow
            title={getWindowTitle()}
            onClose={handleCloseWindow}
            initialX={100}
            initialY={100}
            initialWidth={800}
            initialHeight={600}
          >
            {renderWindowContent()}
          </MacWindow>
        )}
      </div>
    </div>
  );
}