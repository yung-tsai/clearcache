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
      <div className="mac-title-bar">
        {/* Close Button */}
        <div className="mac-close-button"></div>
        
        {/* Left Stripes */}
        <div className="mac-title-bar-stripes-left"></div>
        
        {/* Center Title */}
        <div className="mac-title-bar-center">
          {title}
        </div>
        
        {/* Right Stripes */}
        <div className="mac-title-bar-stripes-right"></div>
      </div>
      
      {/* Content Area */}
      <div className="mac-content">
        {children}
      </div>
    </div>
  );
};

export default MacWindow;