import React, { ReactNode } from 'react';

interface MacWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const MacWindow = ({ title, children, className = "" }: MacWindowProps) => {
  return (
    <div className={`mac-window ${className}`}>
      {/* Title Bar */}
      <div className="mac-title-bar flex items-center justify-center relative">
        <div className="text-sm font-mono font-bold text-black">{title}</div>
      </div>
      
      {/* Content Area */}
      <div className="mac-content">
        {children}
      </div>
    </div>
  );
};

export default MacWindow;