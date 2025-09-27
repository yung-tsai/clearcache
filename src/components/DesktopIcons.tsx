import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import journalFolderIcon from '@/assets/journal-folder.png';
import newEntryIcon from '@/assets/new-entry.png';
import calendarIcon from '@/assets/calendar-icon2.png';

interface DesktopIconsProps {
  onIconAction: (action: string) => void;
}

interface DesktopIcon {
  id: string;
  icon: string;
  name: string;
  action: string;
  x: number;
  y: number;
}

interface DraggableIconProps {
  icon: DesktopIcon;
  onAction: (action: string) => void;
}

function DraggableIcon({ icon, onAction }: DraggableIconProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: icon.id,
    data: { x: icon.x, y: icon.y }
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.7 : 1,
    position: 'absolute' as const,
    left: icon.x,
    top: icon.y,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          onClick={() => onAction(icon.action)}
          className="w-16 h-20 flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 hover:bg-white/10 active:scale-95 cursor-grab active:cursor-grabbing group"
        >
          <img 
            src={icon.icon} 
            alt={icon.name}
            className="w-12 h-12 object-contain pointer-events-none mb-1"
          />
          <span className="text-xs text-white drop-shadow-lg font-medium text-center leading-tight">
            {icon.name}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="ml-2">
        <p className="text-sm font-medium">{icon.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const DESKTOP_ICONS_STORAGE_KEY = 'desktop-icons-positions';
const GRID_SIZE = 20;
const ICON_WIDTH = 64; // 16 * 4 (w-16)
const ICON_HEIGHT = 80; // 20 * 4 (h-20)

const defaultIcons: Omit<DesktopIcon, 'x' | 'y'>[] = [
  {
    id: 'journal-folder',
    icon: journalFolderIcon,
    name: 'Journal Folder',
    action: 'journal-folder'
  },
  {
    id: 'new-entry',
    icon: newEntryIcon,
    name: 'New Entry',
    action: 'new-entry'
  },
  {
    id: 'calendar',
    icon: calendarIcon,
    name: 'Calendar',
    action: 'journal-calendar'
  }
];

const getInitialPositions = (): DesktopIcon[] => {
  return defaultIcons.map((icon, index) => ({
    ...icon,
    x: 20, // Start from left edge with padding
    y: 60 + (index * (ICON_HEIGHT + 10)) // Start below menu bar, spaced vertically
  }));
};

const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

const constrainToScreen = (x: number, y: number): { x: number; y: number } => {
  const maxX = window.innerWidth - ICON_WIDTH;
  const maxY = window.innerHeight - ICON_HEIGHT;
  
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(30, Math.min(y, maxY)) // 30px to avoid menu bar
  };
};

export function DesktopIcons({ onIconAction }: DesktopIconsProps) {
  const [icons, setIcons] = useState<DesktopIcon[]>(getInitialPositions());

  // Load saved positions from localStorage on mount
  useEffect(() => {
    const savedPositions = localStorage.getItem(DESKTOP_ICONS_STORAGE_KEY);
    if (savedPositions) {
      try {
        const positions = JSON.parse(savedPositions);
        const iconsWithPositions = defaultIcons.map(icon => {
          const savedPos = positions[icon.id];
          return {
            ...icon,
            x: savedPos ? savedPos.x : 20,
            y: savedPos ? savedPos.y : 60 + (defaultIcons.findIndex(i => i.id === icon.id) * (ICON_HEIGHT + 10))
          };
        });
        setIcons(iconsWithPositions);
      } catch (error) {
        console.error('Error loading icon positions:', error);
      }
    }
  }, []);

  // Save positions to localStorage whenever icons change
  const saveIconPositions = (icons: DesktopIcon[]) => {
    const positions = icons.reduce((acc, icon) => {
      acc[icon.id] = { x: icon.x, y: icon.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
    localStorage.setItem(DESKTOP_ICONS_STORAGE_KEY, JSON.stringify(positions));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    
    if (!delta) return;

    setIcons((prevIcons) => {
      const updatedIcons = prevIcons.map(icon => {
        if (icon.id === active.id) {
          const newX = icon.x + delta.x;
          const newY = icon.y + delta.y;
          
          // Apply constraints and grid snapping
          const constrained = constrainToScreen(newX, newY);
          const snapped = {
            x: snapToGrid(constrained.x),
            y: snapToGrid(constrained.y)
          };
          
          return { ...icon, ...snapped };
        }
        return icon;
      });
      
      saveIconPositions(updatedIcons);
      return updatedIcons;
    });
  }

  return (
    <TooltipProvider>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {icons.map((icon) => (
          <DraggableIcon
            key={icon.id}
            icon={icon}
            onAction={onIconAction}
          />
        ))}
      </DndContext>
    </TooltipProvider>
  );
}