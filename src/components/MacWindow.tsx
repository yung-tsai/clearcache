import { useState, useRef, useEffect, ReactNode } from 'react';

interface MacWindowProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  className?: string;
}

export function MacWindow({
  title,
  children,
  onClose,
  initialX = 100,
  initialY = 100,
  initialWidth = 600,
  initialHeight = 400,
  className = ""
}: MacWindowProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).classList.contains('window-titlebar')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
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
      className={`absolute bg-white border border-black shadow-lg select-none ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: 300,
        minHeight: 200
      }}
    >
      {/* Title Bar */}
      <div
        className="window-titlebar h-6 bg-white border-b border-black flex items-center px-2 cursor-move relative overflow-hidden"
        onMouseDown={handleMouseDown}
        style={{
          background: `
            white,
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 1px,
              #000 1px,
              #000 2px,
              transparent 2px,
              transparent 4px
            )
          `,
          backgroundSize: '100% 4px'
        }}
      >
        {/* Close Button */}
        {onClose && (
          <button
            className="w-3 h-3 bg-white border border-black/40 hover:bg-gray-100 transition-colors flex-shrink-0"
            onClick={onClose}
            title="Close"
          />
        )}
        
        {/* Title */}
        <div className="flex-1 text-center text-xs font-medium text-black pointer-events-none">
          {title}
        </div>
        
        {/* Spacer for balance */}
        <div className="w-3 flex-shrink-0" />
      </div>

      {/* Content Area */}
      <div className="h-full pb-5 pr-5 overflow-hidden">
        <div className="h-full overflow-auto p-4">
          {children}
        </div>
      </div>

      {/* Resize Handle */}
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
    </div>
  );
}