import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Entry } from '@/lib/database.types';
import { Mic, MicOff, Trash2, Save } from 'lucide-react';
import WordLikeEditor from '@/components/editor/WordLikeEditor';

interface JournalEditorProps {
  entryId?: string;
  onDelete?: () => void;
  onEntryCreated?: (entryId: string, title: string) => void;
  onTitleUpdate?: (title: string) => void;
}

export default function JournalEditor({ entryId, onDelete, onEntryCreated, onTitleUpdate }: JournalEditorProps) {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editorRef = useRef<any>(null);
  const [html, setHtml] = useState<string>('');
  const lastSavedContentRef = useRef<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isListening, transcript, start, stop, reset } = useSpeech();

  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else {
      // Set default date for new entries
      setTimeout(() => {
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        const defaultContent = `<h1>${dateString}</h1><p></p>`;
        setHtml(defaultContent);
        lastSavedContentRef.current = defaultContent;
      }, 0);
    }
  }, [entryId]);

  useEffect(() => {
    if (transcript && editorRef.current) {
      // @ts-ignore
      editorRef.current.chain().focus().insertContent(transcript).run();
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
        return;
      }

      setEntry(data);
      const content = data.content || '<h1>Untitled Entry</h1><p></p>';
      setHtml(content);
      lastSavedContentRef.current = content;
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  const extractTextTitle = (htmlContent: string) => {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    // Look for h1 first, then any first text content
    const h1 = div.querySelector('h1')?.textContent;
    if (h1) return h1.trim();
    
    const firstTextNode = div.textContent || '';
    const firstLine = firstTextNode.split('\n')[0];
    return firstLine.trim();
  };

  const saveEntry = useCallback(async (htmlContent: string) => {
    if (!htmlContent || htmlContent === lastSavedContentRef.current) return;

    setLoading(true);
    
    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const title = extractTextTitle(htmlContent);
      
      if (entryId) {
        const { error } = await supabase
          .from('entries')
          .update({
            title: title || 'Untitled Entry',
            content: htmlContent.trim(),
          })
          .eq('id', entryId);

        if (error) throw error;
        
        // Notify parent about title update
        onTitleUpdate?.(title || 'Untitled Entry');
        
        toast({
          title: 'Saved',
          description: 'Your entry has been saved.',
        });
      } else {
        const { data, error } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            title: title || 'Untitled Entry',
            content: htmlContent.trim(),
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        
        // Update the entryId for future saves
        if (data) {
          console.log('New entry created:', data.id);
          onEntryCreated?.(data.id, title);
          toast({
            title: 'Entry Created',
            description: 'Your new entry has been saved.',
          });
        }
      }
      
      lastSavedContentRef.current = htmlContent;
      setHasUnsavedChanges(false);
      
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
  }, [entryId, user?.id, toast, onEntryCreated]);

  const handleSave = useCallback(() => {
    const htmlContent = html;
    saveEntry(htmlContent);
  }, [saveEntry, html]);

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

  // TipTap handles all formatting and keyboard shortcuts internally

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <div className="flex-1">
        <WordLikeEditor
          value={html}
          onChange={(val) => {
            setHtml(val);
            setHasUnsavedChanges(val.trim() !== lastSavedContentRef.current.trim());
          }}
          onReady={(editor) => {
            // store editor instance for voice insertion
            // @ts-ignore
            editorRef.current = editor;
          }}
          className="bg-white rounded-md p-2"
        />
      </div>

      {/* Fixed buttons */}
      <div className="fixed bottom-4 left-4 z-10 flex gap-2">
        {isSupported && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleMicToggle}
            disabled={loading}
            className="mac-button flex items-center gap-1 shadow-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            {isListening ? <MicOff size={12} /> : <Mic size={12} />}
            {isListening ? 'Stop' : 'Mic'}
          </Button>
        )}
        
        <Button
          type="button"
          variant="ghost"
          onClick={handleSave}
          disabled={loading || !hasUnsavedChanges}
          className="mac-button flex items-center gap-1 shadow-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          <Save size={12} />
          {hasUnsavedChanges ? 'Save' : 'Saved'}
        </Button>

        {entryId && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={loading}
            className="mac-button flex items-center gap-1 shadow-lg border border-gray-300 bg-white hover:bg-gray-50 text-red-600 hover:text-red-700"
          >
            <Trash2 size={12} />
            Delete
          </Button>
        )}
      </div>

      {isListening && (
        <div className="fixed bottom-16 left-4 text-xs font-mono text-muted-foreground bg-white px-2 py-1 rounded border shadow-sm">
          🎤 Listening...
        </div>
      )}
    </div>
  );
}