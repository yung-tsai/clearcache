import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Entry } from '@/lib/database.types';
import { MacWindow } from '@/components/MacWindow';
import { Mic, MicOff, Save, Trash2 } from 'lucide-react';

interface JournalEditorProps {
  entryId?: string;
  onDelete?: () => void;
}

export default function JournalEditor({ entryId, onDelete }: JournalEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSupported, isListening, transcript, start, stop, reset } = useSpeech();

  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    }
  }, [entryId]);

  useEffect(() => {
    if (transcript) {
      setContent(prev => prev + ' ' + transcript);
      reset();
    }
  }, [transcript, reset]);

  const loadEntry = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Could not load entry',
          variant: 'destructive',
        });
        navigate('/app/folder');
        return;
      }

      setEntry(data);
      setTitle(data.title || '');
      setContent(data.content || '');
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;

    setLoading(true);
    
    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      if (entryId) {
        const { error } = await supabase
          .from('entries')
          .update({
            title: title.trim() || null,
            content: content.trim() || null,
          })
          .eq('id', entryId);

        if (error) throw error;

        toast({
          title: 'Entry Updated',
          description: 'Your journal entry has been saved.',
        });
      } else {
        const { data, error } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            title: title.trim() || null,
            content: content.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Entry Saved',
          description: 'Your journal entry has been created.',
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Error',
        description: 'Could not save your entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entryId || !confirm('Are you sure you want to delete this entry?')) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: 'Entry Deleted',
        description: 'Your journal entry has been deleted.',
      });

      onDelete?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Error',
        description: 'Could not delete your entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-mono font-bold mb-2">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title (optional)"
          className="font-mono"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-mono font-bold mb-2">
          Content
          {isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMicToggle}
              className="ml-2 p-1 h-6 w-6"
            >
              {isListening ? <MicOff size={12} /> : <Mic size={12} />}
            </Button>
          )}
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your thoughts..."
          className="min-h-[300px] font-mono resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end">
        {entryId && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="mac-button flex items-center gap-1"
          >
            <Trash2 size={12} />
            Delete
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          disabled={loading || (!title.trim() && !content.trim())}
          className="mac-button flex items-center gap-1"
        >
          <Save size={12} />
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {isListening && (
        <div className="text-center text-sm font-mono text-muted-foreground">
          🎤 Listening... Speak now
        </div>
      )}
    </div>
  );
}