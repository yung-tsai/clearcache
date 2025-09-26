import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import journalFolderIcon from '@/assets/journal-folder.png';
import newEntryIcon from '@/assets/new-entry.png';

interface MacDockProps {
  onDockAction: (action: string) => void;
}

export function MacDock({ onDockAction }: MacDockProps) {
  const dockItems = [
    {
      icon: journalFolderIcon,
      name: 'Journal Folder',
      action: 'journal-folder'
    },
    {
      icon: newEntryIcon,
      name: 'New Entry',
      action: 'new-entry'
    }
  ];

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg">
          {dockItems.map((item) => (
            <Tooltip key={item.action}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDockAction(item.action)}
                  className="w-16 h-16 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 hover:bg-white/20 active:scale-95"
                >
                  <img 
                    src={item.icon} 
                    alt={item.name}
                    className="w-16 h-16 object-contain"
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="mb-2">
                <p className="text-sm font-medium">{item.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}