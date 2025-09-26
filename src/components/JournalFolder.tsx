import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Entry } from '@/lib/database.types';
import { MacWindow } from '@/components/MacWindow';
import { Plus, Search } from 'lucide-react';

interface JournalFolderProps {
  onOpenEntry?: (entryId: string, title: string) => void;
}

export default function JournalFolder({ onOpenEntry }: JournalFolderProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadEntries();
  }, [sortOrder]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'oldest' });

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

  const filteredEntries = entries.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (entry.title?.toLowerCase().includes(query)) ||
      (entry.content?.toLowerCase().includes(query))
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const extractTitle = (content: string | null) => {
    if (!content) return 'Untitled Entry';
    
    // Try to extract first line from HTML content
    const div = document.createElement('div');
    div.innerHTML = content;
    const firstDiv = div.querySelector('div');
    
    if (firstDiv) {
      const title = firstDiv.textContent?.trim() || '';
      return title || 'Untitled Entry';
    }
    
    // Fallback for plain text
    const firstLine = content.split('\n')[0]?.trim() || '';
    return firstLine || 'Untitled Entry';
  };

  const getPreview = (content: string | null) => {
    if (!content) return 'No content';
    
    // Extract text from HTML
    const div = document.createElement('div');
    div.innerHTML = content;
    const textContent = div.textContent || div.innerText || '';
    
    // Skip the first line (title) and show the rest as preview
    const lines = textContent.split('\n').filter(line => line.trim());
    const previewText = lines.length > 1 ? lines.slice(1).join(' ') : (lines[0] || 'No content');
    
    return previewText.length > 100 ? previewText.substring(0, 100) + '...' : previewText;
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-mono"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={sortOrder === 'newest' ? 'default' : 'outline'}
            onClick={() => setSortOrder('newest')}
            className="mac-button text-xs"
          >
            Newest
          </Button>
          <Button
            variant={sortOrder === 'oldest' ? 'default' : 'outline'}
            onClick={() => setSortOrder('oldest')}
            className="mac-button text-xs"
          >
            Oldest
          </Button>
        </div>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-sm font-mono">Loading entries...</div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm font-mono text-muted-foreground mb-4">
            {searchQuery ? 'No entries match your search' : 'No journal entries yet'}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="block border border-black bg-white p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                if (onOpenEntry) {
                  onOpenEntry(entry.id, extractTitle(entry.content));
                }
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-mono font-bold text-sm truncate flex-1 mr-4">
                  {extractTitle(entry.content)}
                </h3>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatDate(entry.created_at)}
                </div>
              </div>
              <div className="text-xs font-mono text-muted-foreground line-clamp-2">
                {getPreview(entry.content)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}