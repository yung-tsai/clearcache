import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Entry } from '@/lib/database.types';
import MacWindow from '@/components/MacWindow';
import { Plus, Search } from 'lucide-react';

export default function JournalFolder() {
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

  const getPreview = (content: string | null) => {
    if (!content) return 'No content';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <MacWindow title="Journal Folder" className="max-w-6xl mx-auto">
        <div className="p-6">
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
              <Button
                onClick={() => navigate('/app/new')}
                className="mac-button flex items-center gap-1"
              >
                <Plus size={12} />
                New Entry
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
              {!searchQuery && (
                <Button
                  onClick={() => navigate('/app/new')}
                  className="mac-button"
                >
                  Create your first entry
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/app/entry/${entry.id}`}
                  className="block border border-black bg-white p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-mono font-bold text-sm truncate flex-1 mr-4">
                      {entry.title || 'Untitled Entry'}
                    </h3>
                    <div className="text-xs font-mono text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground line-clamp-2">
                    {getPreview(entry.content)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </MacWindow>
    </div>
  );
}