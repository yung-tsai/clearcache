import { useState } from 'react';
import { BackgroundSelector } from './BackgroundSelector';

interface MacMenuBarProps {
  onMenuAction: (action: string) => void;
}

export function MacMenuBar({ onMenuAction }: MacMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

  const menuItems = [
    {
      label: 'File',
      items: [
        { label: 'New Entry', action: 'new-entry', shortcut: '⌘N' },
        { label: 'Search Entries', action: 'journal-folder', shortcut: '⌘F' },
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Backgrounds', action: 'backgrounds', shortcut: '⌘B' },
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Calendar', action: 'journal-calendar', shortcut: '⌘2' },
        { label: 'Streaks', action: 'streaks', shortcut: '⌘3' },
      ]
    },
    {
      label: 'Profile',
      items: [
        { label: 'Settings...', action: 'settings', shortcut: '⌘,' },
        { label: '---' },
        { label: 'Sign Out', action: 'sign-out', disabled: true },
      ]
    }
  ];

  const handleMenuClick = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
  };

  const handleMenuItemClick = (action: string, disabled?: boolean) => {
    if (!disabled) {
      if (action === 'backgrounds') {
        setShowBackgroundSelector(true);
        setActiveMenu(null);
      } else {
        onMenuAction(action);
        setActiveMenu(null);
      }
    } else {
      setActiveMenu(null);
    }
  };

  const handleOutsideClick = () => {
    setActiveMenu(null);
    setShowBackgroundSelector(false);
  };

  return (
    <>
      {/* Invisible overlay to catch outside clicks */}
      {(activeMenu || showBackgroundSelector) && (
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
            
            {/* Background Selector Dropdown */}
            {menu.label === 'Edit' && showBackgroundSelector && (
              <div className="absolute" style={{ top: 'calc(100% + 24px)', left: 0 }}>
                <BackgroundSelector onClose={() => setShowBackgroundSelector(false)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}