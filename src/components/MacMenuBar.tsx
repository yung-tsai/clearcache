import { useState } from 'react';

interface MacMenuBarProps {
  onMenuAction: (action: string) => void;
}

export function MacMenuBar({ onMenuAction }: MacMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuItems = [
    {
      label: 'File',
      items: [
        { label: 'New Entry', action: 'new-entry', shortcut: '⌘N' },
        { label: 'Open...', action: 'open', shortcut: '⌘O', disabled: true },
        { label: 'Save', action: 'save', shortcut: '⌘S', disabled: true },
        { label: '---' },
        { label: 'Quit', action: 'quit', shortcut: '⌘Q', disabled: true },
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: 'undo', shortcut: '⌘Z', disabled: true },
        { label: 'Redo', action: 'redo', shortcut: '⌘⇧Z', disabled: true },
        { label: '---' },
        { label: 'Cut', action: 'cut', shortcut: '⌘X', disabled: true },
        { label: 'Copy', action: 'copy', shortcut: '⌘C', disabled: true },
        { label: 'Paste', action: 'paste', shortcut: '⌘V', disabled: true },
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Journal Folder', action: 'journal-folder', shortcut: '⌘1' },
        { label: 'Calendar', action: 'journal-calendar', shortcut: '⌘2' },
        { label: 'Streaks', action: 'streaks', shortcut: '⌘3' },
        { label: 'Refresh', action: 'refresh', shortcut: '⌘R', disabled: true },
        { label: '---' },
        { label: 'Zoom In', action: 'zoom-in', shortcut: '⌘+', disabled: true },
        { label: 'Zoom Out', action: 'zoom-out', shortcut: '⌘-', disabled: true },
      ]
    },
    {
      label: 'Special',
      items: [
        { label: 'About This App', action: 'about', disabled: true },
        { label: 'Preferences...', action: 'preferences', shortcut: '⌘,', disabled: true },
        { label: '---' },
        { label: 'System Info', action: 'system-info', disabled: true },
      ]
    }
  ];

  const handleMenuClick = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
  };

  const handleMenuItemClick = (action: string, disabled?: boolean) => {
    if (!disabled) {
      onMenuAction(action);
    }
    setActiveMenu(null);
  };

  const handleOutsideClick = () => {
    setActiveMenu(null);
  };

  return (
    <>
      {/* Invisible overlay to catch outside clicks */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={handleOutsideClick}
        />
      )}
      
      <div className="fixed top-0 left-0 right-0 h-6 bg-white flex items-start px-3 font-chicago font-medium z-20" style={{ boxShadow: '0px 1px 0px #000000', fontSize: '14px', lineHeight: '18px', letterSpacing: '-0.35px', fontWeight: '500' }}>
        {menuItems.map((menu) => (
          <div key={menu.label} className="relative">
            <button
              className={`h-6 flex items-center rounded transition-colors gap-0.5 ${
                activeMenu === menu.label ? 'bg-black/15' : ''
              }`}
              style={{ padding: '4px 8px' }}
              onClick={() => handleMenuClick(menu.label)}
            >
              {menu.label}
            </button>
            
            {activeMenu === menu.label && (
              <div className="absolute top-full left-0 mt-0 bg-white border border-black/20 shadow-lg min-w-48 z-30">
                {menu.items.map((item, index) => (
                  item.label === '---' ? (
                    <div key={index} className="h-px bg-black/10 my-1 mx-2" />
                  ) : (
                    <button
                      key={item.label}
                      className={`w-full text-left px-4 py-1 hover:bg-blue-500 hover:text-white transition-colors flex justify-between items-center ${
                        item.disabled ? 'text-gray-400 cursor-not-allowed' : ''
                      }`}
                      onClick={() => handleMenuItemClick(item.action, item.disabled)}
                      disabled={item.disabled}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs opacity-70">{item.shortcut}</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}