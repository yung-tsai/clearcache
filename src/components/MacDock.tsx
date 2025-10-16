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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import journalFolderIcon from '@/assets/journal-folder.png';
import newEntryIcon from '@/assets/new-entry.png';
import calendarIcon from '@/assets/calendar-icon2.png';

interface MacDockProps {
  onDockAction: (action: string) => void;
}

interface DockItem {
  id: string;
  icon: string;
  name: string;
  action: string;
}

interface SortableDockItemProps {
  item: DockItem;
  onAction: (action: string) => void;
}

function SortableDockItem({ item, onAction }: SortableDockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          onClick={() => onAction(item.action)}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing"
        >
          <img 
            src={item.icon} 
            alt={item.name}
            className="w-8 h-8 object-contain pointer-events-none"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="mb-2">
        <p className="text-sm font-medium">{item.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const DOCK_STORAGE_KEY = 'macdock-order';

const defaultDockItems: DockItem[] = [
  {
    id: 'journal-folder',
    icon: journalFolderIcon,
    name: 'Entries',
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

export function MacDock({ onDockAction }: MacDockProps) {
  const [dockItems, setDockItems] = useState<DockItem[]>(defaultDockItems);

  // Load saved order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem(DOCK_STORAGE_KEY);
    if (savedOrder) {
      try {
        const orderArray = JSON.parse(savedOrder);
        // Reorder items based on saved order
        const reorderedItems = orderArray
          .map((id: string) => defaultDockItems.find(item => item.id === id))
          .filter(Boolean) as DockItem[];
        
        // Add any new items that weren't in saved order
        const newItems = defaultDockItems.filter(
          item => !orderArray.includes(item.id)
        );
        
        setDockItems([...reorderedItems, ...newItems]);
      } catch (error) {
        console.error('Error loading dock order:', error);
      }
    }
  }, []);

  // Save order to localStorage whenever items change
  const saveDockOrder = (items: DockItem[]) => {
    const order = items.map(item => item.id);
    localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(order));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setDockItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        saveDockOrder(newItems);
        return newItems;
      });
    }
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-sm bg-white/20 border border-white/10 shadow-lg">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={dockItems.map(item => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              {dockItems.map((item) => (
                <SortableDockItem
                  key={item.id}
                  item={item}
                  onAction={onDockAction}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </TooltipProvider>
  );
}