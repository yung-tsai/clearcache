import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Entry } from '@/lib/database.types';
import { format } from 'date-fns';

interface JournalFolderProps {
  onOpenEntry?: (entryId: string, title: string) => void;
}

type SortField = 'name' | 'date' | 'wordCount';
type SortOrder = 'asc' | 'desc';

export default function JournalFolder({ onOpenEntry }: JournalFolderProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: 'Error',
        description: 'Could not load journal entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEE, MMM d, yyyy');
  };

  const getWordCount = (content: string | null) => {
    if (!content) return 0;
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const extractTitle = (entry: Entry) => {
    // Use the title field if available
    if (entry.title && entry.title.trim()) {
      return entry.title;
    }
    
    // Fallback to extracting from content
    if (!entry.content) return 'Untitled';
    
    const div = document.createElement('div');
    div.innerHTML = entry.content;
    const firstDiv = div.querySelector('div');
    
    if (firstDiv) {
      const title = firstDiv.textContent?.trim() || '';
      return title || 'Untitled';
    }
    
    const firstLine = entry.content.split('\n')[0]?.trim() || '';
    return firstLine || 'Untitled';
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = extractTitle(a).localeCompare(extractTitle(b));
        break;
      case 'date':
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
      case 'wordCount':
        comparison = getWordCount(a.content) - getWordCount(b.content);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Infobar */}
      <div className="relative h-[29px] mx-[2px] bg-white">
        {/* Double line border at bottom */}
        <div className="absolute bottom-[3px] left-0 right-0 h-[1px] bg-black" />
        <div className="absolute bottom-[1px] left-0 right-0 h-[1px] bg-black" />
        
        <div className="absolute inset-0 flex items-center px-4 pt-1">
          {/* Left: Name */}
          <div className="flex-1 text-left">
            <button
              onClick={() => handleSort('name')}
              className="font-mono text-sm hover:opacity-70 transition-opacity"
            >
              Name
            </button>
          </div>
          
          {/* Center: Word Count */}
          <div className="flex-1 text-left">
            <button
              onClick={() => handleSort('wordCount')}
              className="font-mono text-sm hover:opacity-70 transition-opacity"
            >
              Word Count
            </button>
          </div>
          
          {/* Right: Last Modified */}
          <div className="flex-1 text-left">
            <button
              onClick={() => handleSort('date')}
              className="font-mono text-sm hover:opacity-70 transition-opacity"
            >
              Last Modified
            </button>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-sm font-mono">Loading entries...</div>
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm font-mono text-muted-foreground">
              No journal entries yet
            </div>
          </div>
        ) : (
          <div>
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-[#E8E8E8] transition-colors"
                onClick={() => {
                  if (onOpenEntry) {
                    onOpenEntry(entry.id, extractTitle(entry));
                  }
                }}
              >
                {/* Name */}
                <div className="flex-1 text-left">
                  <span className="font-mono text-sm font-bold">
                    {extractTitle(entry)}
                  </span>
                </div>
                
                {/* Word Count */}
                <div className="flex-1 text-left">
                  <span className="font-mono text-sm">
                    {getWordCount(entry.content)}
                  </span>
                </div>
                
                {/* Last Modified */}
                <div className="flex-1 text-left">
                  <span className="font-mono text-sm">
                    {formatDate(entry.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}