import React from 'react';

const MacMenuBar = () => {
  const menuItems = ['File', 'Edit', 'View', 'Special'];
  
  return (
    <div className="mac-menu-bar flex items-center space-x-4">
      {menuItems.map((item) => (
        <button
          key={item}
          className="text-sm font-mono font-bold text-black hover:bg-black hover:text-white px-2 py-0.5 transition-colors"
        >
          {item}
        </button>
      ))}
    </div>
  );
};

export default MacMenuBar;