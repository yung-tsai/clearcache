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
        className="window-titlebar h-7 bg-white border-b border-black cursor-move relative overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {/* Horizontal Bars */}
        <div className="absolute left-1 right-1 top-1.5 h-px bg-black"></div>
        <div className="absolute left-1 right-1 top-2.5 h-px bg-black"></div>
        <div className="absolute left-1 right-1 top-3 h-px bg-black"></div>
        <div className="absolute left-1 right-1 top-3.5 h-px bg-black"></div>
        <div className="absolute left-1 right-1 top-4.5 h-px bg-black"></div>
        <div className="absolute left-1 right-1 top-5 h-px bg-black"></div>

        {/* Close Button */}
        {onClose && (
          <button
            className="absolute left-3.5 top-1.5 w-4 h-4 bg-white border border-black hover:bg-gray-100 transition-colors"
            onClick={onClose}
            title="Close"
          />
        )}
        
        {/* Title */}
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 h-full flex items-center bg-white px-2">
          <div className="text-sm font-medium text-black pointer-events-none">
            {title}
          </div>
        </div>
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