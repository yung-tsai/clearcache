import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Entry } from '@/lib/database.types';
import { Mic, MicOff, Save, Trash2 } from 'lucide-react';

interface JournalEditorProps {
  entryId?: string;
  onDelete?: () => void;
}

export default function JournalEditor({ entryId, onDelete }: JournalEditorProps) {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isListening, transcript, start, stop, reset } = useSpeech();

  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else {
      // Set default date for new entries
      setTimeout(() => {
        if (contentRef.current) {
          const today = new Date();
          const dateString = today.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          contentRef.current.innerHTML = `<div style="font-size: 24px; font-weight: bold;">${dateString}</div><div><br></div>`;
          // Position cursor at the end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
  }, [entryId]);

  useEffect(() => {
    if (transcript && contentRef.current) {
      insertTextAtCursor(transcript);
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
      if (contentRef.current) {
        contentRef.current.innerHTML = data.content || '<div><br></div>';
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  const extractTextTitle = (htmlContent: string) => {
    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    const firstLine = div.querySelector('div')?.textContent || '';
    return firstLine.trim();
  };

  const handleSave = async () => {
    const plainTextContent = contentRef.current?.textContent?.trim() || '';
    if (!plainTextContent) return;

    setLoading(true);
    
    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const htmlContent = contentRef.current?.innerHTML || '';
      const title = extractTextTitle(htmlContent);
      
      if (entryId) {
        const { error } = await supabase
          .from('entries')
          .update({
            title: title || null,
            content: htmlContent.trim() || null,
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
            title: title || null,
            content: htmlContent.trim() || null,
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

  const insertTextAtCursor = (text: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('strikeThrough');
          }
          break;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('indent');
    } else if (e.key === ' ') {
      // Check for dash + space to convert to bullet
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || '';
        if (textBefore.endsWith('-')) {
          e.preventDefault();
          // Remove the dash
          range.setStart(range.startContainer, range.startOffset - 1);
          range.deleteContents();
          // Insert bullet point
          const bulletNode = document.createTextNode('• ');
          range.insertNode(bulletNode);
          range.setStartAfter(bulletNode);
          range.setEndAfter(bulletNode);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [execCommand]);

  const handleContentChange = useCallback(() => {
    // Content is now managed directly through contentRef, no state updates needed
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    insertTextAtCursor(text);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="min-h-[300px] font-mono resize-none border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
          style={{ lineHeight: '1.5' }}
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
        
        {isSupported && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleMicToggle}
            disabled={loading}
            className="mac-button flex items-center gap-1"
          >
            {isListening ? <MicOff size={12} /> : <Mic size={12} />}
            {isListening ? 'Stop' : 'Mic'}
          </Button>
        )}
        
        <Button
          onClick={handleSave}
          disabled={loading || !contentRef.current?.textContent?.trim()}
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