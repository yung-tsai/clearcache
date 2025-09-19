import React, { useState, useEffect } from 'react';
import MacWindow from './MacWindow';
import MacMenuBar from './MacMenuBar';

const Journal = () => {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<Array<{ id: string; content: string; date: string }>>([]);

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('mac-journal-entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save entry to "desktop" (localStorage)
  const saveEntry = () => {
    if (content.trim()) {
      const newEntry = {
        id: Date.now().toString(),
        content: content,
        date: new Date().toLocaleDateString()
      };
      
      const updatedEntries = [...entries, newEntry];
      setEntries(updatedEntries);
      localStorage.setItem('mac-journal-entries', JSON.stringify(updatedEntries));
      
      // Clear the editor after saving
      setContent('');
      
      // Show a simple alert (very Mac-like)
      alert('Entry saved to desktop!');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Menu Bar */}
      <MacMenuBar />
      
      {/* Main Journal Window */}
      <div className="flex justify-center mt-8">
        <MacWindow title="Journal Entry" className="w-full max-w-2xl">
          <div className="p-4">
            {/* Text Editor */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-96 p-2 border border-black font-mono text-sm resize-none focus:outline-none"
              placeholder="Write your journal entry..."
              style={{ 
                backgroundColor: 'white',
                fontFamily: 'Monaco, Menlo, Courier New, monospace'
              }}
            />
            
            {/* Save Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveEntry}
                className="mac-button"
                disabled={!content.trim()}
              >
                Save to Desktop
              </button>
            </div>
          </div>
        </MacWindow>
      </div>

      {/* Saved Entries (Desktop) */}
      {entries.length > 0 && (
        <div className="flex justify-center mt-8">
          <MacWindow title="Desktop - Saved Entries" className="w-full max-w-2xl">
            <div className="p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {entries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="p-2 border border-black bg-white cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setContent(entry.content);
                      // Scroll to top to see the editor
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="text-xs font-mono text-gray-600">{entry.date}</div>
                    <div className="text-sm font-mono truncate">
                      {entry.content.substring(0, 100)}
                      {entry.content.length > 100 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MacWindow>
        </div>
      )}
    </div>
  );
};

export default Journal;