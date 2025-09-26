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
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl backdrop-blur-xl bg-black/10 border border-white/10 shadow-2xl supports-[backdrop-filter]:bg-white/5">
          {dockItems.map((item) => (
            <Tooltip key={item.action}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDockAction(item.action)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <img 
                    src={item.icon} 
                    alt={item.name}
                    className="w-8 h-8 object-contain"
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