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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
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

      const loadedEntries = data || [];
      setEntries(loadedEntries);
      
      // Extract unique years and set default selection
      if (loadedEntries.length > 0) {
        const years = loadedEntries.map(entry => new Date(entry.created_at).getFullYear());
        const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
        setAvailableYears(uniqueYears);
        setSelectedYear(uniqueYears[0]); // Select most recent year by default
      }
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

  const filteredEntries = sortedEntries.filter(entry => {
    const title = extractTitle(entry).toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase());
    
    const matchesYear = selectedYear === null || 
      new Date(entry.created_at).getFullYear() === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Infobar */}
      <div className="relative h-[28px] mx-[2px] bg-white">
        {/* Double line border at bottom */}
        <div className="absolute bottom-[4px] left-0 right-0 h-[1px] bg-black" />
        <div className="absolute bottom-[1px] left-0 right-0 h-[1px] bg-black" />
        
        <div className="absolute inset-0 flex items-center px-4 pb-2" style={{ paddingTop: '0.2rem', paddingLeft: '200px' }}>
          {/* Left: Name */}
          <div className="text-left">
            <button
              onClick={() => handleSort('name')}
              className="hover:opacity-70 transition-opacity"
              style={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              Name
            </button>
          </div>
          
          {/* Center: Word Count */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => handleSort('wordCount')}
              className="hover:opacity-70 transition-opacity"
              style={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              Word Count
            </button>
          </div>
          
          {/* Right: Last Modified */}
          <div className="absolute right-4">
            <button
              onClick={() => handleSort('date')}
              className="hover:opacity-70 transition-opacity"
              style={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              Last Modified
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar + Entries List */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-[200px] bg-white border-r border-black flex flex-col">
          {/* Search Box */}
          <div className="p-4 border-b border-black">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entry name"
              className="w-full h-8 px-3 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
              style={{
                fontFamily: 'Open Sans, sans-serif',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Year Filter */}
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col items-end py-[10px] px-0 gap-[6px]">
            {/* Year Label */}
            <div className="flex flex-row items-center w-[178px] h-[20px]">
              <h3 
                style={{
                  fontFamily: 'ChicagoFLF',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '20px',
                  color: '#000000',
                }}
              >
                Year
              </h3>
            </div>
            
            {/* Year Buttons Container */}
            <div className="flex flex-col items-start w-[178px]">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`w-full text-left flex items-center transition-colors ${
                    selectedYear === year ? 'bg-[#F1F1F1]' : 'hover:bg-gray-100'
                  }`}
                  style={{
                    height: '28px',
                    padding: '4px 8px',
                    fontFamily: 'Open Sans',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '20px',
                    color: '#4C4C4C',
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
            
            {/* Mood Filter Section (future feature) */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold mb-2 text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Mood
              </h3>
              <div className="text-xs text-gray-400" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                Coming soon
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-sm font-mono">Loading entries...</div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm font-mono text-muted-foreground">
                  {searchQuery ? 'No entries match your search' : 'No journal entries yet'}
                </div>
              </div>
            ) : (
              <div>
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="relative flex items-center px-4 py-2 cursor-pointer hover:bg-[#E8E8E8] transition-colors"
                    onClick={() => {
                      if (onOpenEntry) {
                        onOpenEntry(entry.id, extractTitle(entry));
                      }
                    }}
                  >
                    {/* Name */}
                    <div className="text-left">
                      <span 
                        style={{
                          fontFamily: 'Open Sans, sans-serif',
                          fontSize: '16px',
                          fontWeight: 600,
                        }}
                      >
                        {extractTitle(entry)}
                      </span>
                    </div>
                    
                    {/* Word Count */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                      <span 
                        style={{
                          fontFamily: 'Open Sans, sans-serif',
                          fontSize: '16px',
                          fontWeight: 400,
                        }}
                      >
                        {getWordCount(entry.content)}
                      </span>
                    </div>
                    
                    {/* Last Modified */}
                    <div className="absolute right-4">
                      <span 
                        style={{
                          fontFamily: 'Open Sans, sans-serif',
                          fontSize: '16px',
                          fontWeight: 400,
                        }}
                      >
                        {formatDate(entry.updated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}