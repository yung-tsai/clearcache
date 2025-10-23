import { useState, useRef, useEffect, ReactNode } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface MacWindowProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  onClick?: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  zIndex?: number;
  className?: string;
  noPadding?: boolean;
  hideControls?: boolean;
  showInfoBar?: boolean;
  infoBarLeft?: React.ReactNode;
  infoBarRight?: React.ReactNode;
}

export function MacWindow({
  title,
  children,
  onClose,
  onClick,
  initialX = 100,
  initialY = 100,
  initialWidth = 600,
  initialHeight = 400,
  zIndex = 10,
  className = "",
  noPadding = false,
  hideControls = false,
  showInfoBar = false,
  infoBarLeft,
  infoBarRight
}: MacWindowProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousState, setPreviousState] = useState({ x: initialX, y: initialY, width: initialWidth, height: initialHeight });

  const windowRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSoundEffects();

  // Play window open sound on mount
  useEffect(() => {
    playSound('windowOpen');
  }, [playSound]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging when not maximized and when clicking on title bar areas
    if (!isMaximized && (e.target === e.currentTarget || (e.target as Element).classList.contains('window-titlebar') || (e.target as Element).classList.contains('title-bar-draggable'))) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore to previous state
      setPosition({ x: previousState.x, y: previousState.y });
      setSize({ width: previousState.width, height: previousState.height });
      setIsMaximized(false);
    } else {
      // Save current state and maximize
      setPreviousState({ x: position.x, y: position.y, width: size.width, height: size.height });
      setPosition({ x: 0, y: 24 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 24 });
      setIsMaximized(true);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x)),
          y: Math.max(24, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y))
        });
      }
      
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        setSize({
          width: Math.max(300, resizeStart.width + deltaX),
          height: Math.max(200, resizeStart.height + deltaY)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size.width, size.height]);

  return (
    <div
      ref={windowRef}
      className={`absolute select-none ${className}`}
      onClick={onClick}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: isMaximized ? size.width : 300,
        minHeight: isMaximized ? size.height : 200,
        borderRadius: '0px',
        background: '#FFFFFF',
        border: '1px solid #000000',
        boxShadow: '1px 1px 0px 1px #000000',
        backdropFilter: 'blur(25px)',
        zIndex: zIndex
      }}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar title-bar-draggable cursor-move relative"
        onMouseDown={handleMouseDown}
        style={{
          width: '100%',
          height: '28px',
          background: '#FFFFFF',
          border: '1px solid #000000',
          borderRadius: '0px',
          position: 'relative',
          cursor: isMaximized ? 'default' : 'move'
        }}
      >
        {/* Horizontal Bars */}
        <div 
          className="title-bar-draggable"
          style={{
            position: 'absolute',
            left: '4px',
            right: '4px',
            top: '6px',
            height: '16px',
            pointerEvents: 'none'
          }}
        >
          {/* Individual bars at specific positions */}
          <div style={{ position: 'absolute', height: '1px', left: '0', right: '0', top: '0px', background: '#000000' }} />
          <div style={{ position: 'absolute', height: '1px', left: '0', right: '0', top: '3px', background: '#000000' }} />
          <div style={{ position: 'absolute', height: '1px', left: '0', right: '0', top: '6px', background: '#000000' }} />
          <div style={{ position: 'absolute', height: '1px', left: '0', right: '0', top: '9px', background: '#000000' }} />
          <div style={{ position: 'absolute', height: '1px', left: '0', right: '0', top: '12px', background: '#000000' }} />
          <div style={{ position: 'absolute', height: '1px', left: '0', right: '0', top: '15px', background: '#000000' }} />
        </div>

        {/* Close Button */}
        {!hideControls && onClose && (
          <button
            onClick={() => {
              playSound('windowClose');
              onClose();
            }}
            title="Close"
            style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              left: '14px',
              top: '6px',
              background: '#FFFFFF',
              border: '1px solid #000000',
              cursor: 'pointer'
            }}
          />
        )}

        {/* Expand/Maximize Button */}
        {!hideControls && (
          <button
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
            style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              right: '13px',
              top: '6px',
              background: '#FFFFFF',
              border: '1px solid #000000',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '10px',
                height: '10px',
                left: '0px',
                top: '0px',
                border: '1px solid #000000'
              }}
            />
          </button>
        )}
        
        {/* Title */}
        <div 
          className="title-bar-draggable"
          style={{
            position: 'absolute',
            width: '246px',
            height: '26px',
            left: 'calc(50% - 246px/2)',
            top: '0px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0px 8px'
          }}
        >
          <div
            style={{
              width: '230px',
              height: '26px',
              fontFamily: 'Trispace, sans-serif',
              fontWeight: '500',
              fontSize: '20px',
              lineHeight: '26px',
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              justifyContent: 'center',
              letterSpacing: '-0.004em',
              color: '#000000',
              pointerEvents: 'none'
            }}
          >
            {title}
          </div>
        </div>
      </div>

      {/* Info Bar - appears below title bar */}
      {showInfoBar && (
        <div 
          className="flex justify-between items-center px-4 py-2 border-b-2 border-black bg-white"
          style={{
            fontFamily: 'Trispace, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
          }}
        >
          <div>{infoBarLeft}</div>
          <div>{infoBarRight}</div>
        </div>
      )}

      {/* Content Area */}
      <div 
        style={{
          position: 'absolute',
          top: showInfoBar ? '68px' : '28px',
          left: '0px',
          right: '0px',
          bottom: '0px',
          padding: noPadding ? '0px' : '16px',
          overflow: 'auto'
        }}
      >
        {children}
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
          style={{
            background: `
              linear-gradient(135deg, transparent 0%, transparent 30%, #666 30%, #666 35%, transparent 35%, transparent 65%, #666 65%, #666 70%, transparent 70%),
              linear-gradient(45deg, transparent 0%, transparent 30%, #666 30%, #666 35%, transparent 35%, transparent 65%, #666 65%, #666 70%, transparent 70%)
            `,
            backgroundSize: '4px 4px'
          }}
        />
      )}
    </div>
  );
}