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
    const firstLine = div.querySelector('div')?.textContent || '';
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

  const isInTitleLine = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !contentRef.current) return false;
    
    const range = selection.getRangeAt(0);
    const firstDiv = contentRef.current.querySelector('div');
    
    if (!firstDiv) return false;
    
    // Check if cursor is within the first div
    return firstDiv.contains(range.commonAncestorContainer) || 
           range.commonAncestorContainer === firstDiv;
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    // Prevent formatting commands on title line
    if (isInTitleLine()) {
      return;
    }
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  }, [isInTitleLine]);

  const ensureTitleFormatting = useCallback(() => {
    if (!contentRef.current) return;
    
    const firstDiv = contentRef.current.querySelector('div');
    if (firstDiv) {
      // Ensure title div has correct styling
      firstDiv.style.fontSize = '24px';
      firstDiv.style.fontWeight = 'bold';
      firstDiv.style.marginBottom = '8px';
      
      // If title is empty, set placeholder
      if (!firstDiv.textContent?.trim()) {
        firstDiv.textContent = 'Untitled Entry';
      }
    }
  }, []);

  const isInList = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;
    
    let node = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== contentRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (element.tagName === 'LI') return true;
      }
      node = node.parentNode;
    }
    return false;
  }, []);

  const getCurrentListItem = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;
    
    let node = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== contentRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'LI') {
        return node as HTMLLIElement;
      }
      node = node.parentNode;
    }
    return null;
  }, []);

  const isEmptyListItem = useCallback((li: HTMLLIElement) => {
    const text = li.textContent?.trim() || '';
    return text === '' || text === '\n';
  }, []);

  const toggleBulletList = useCallback(() => {
    if (isInTitleLine()) return;
    
    if (isInList()) {
      // Remove list formatting
      document.execCommand('insertUnorderedList', false);
    } else {
      // Add list formatting
      document.execCommand('insertUnorderedList', false);
    }
    contentRef.current?.focus();
  }, [isInTitleLine, isInList]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const inTitleLine = isInTitleLine();
    const inList = isInList();
    const currentListItem = getCurrentListItem();
    
    if (e.ctrlKey || e.metaKey) {
      // Prevent formatting commands on title line
      if (inTitleLine && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      
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
        case '8':
          if (e.shiftKey) {
            e.preventDefault();
            toggleBulletList();
          }
          break;
      }
    } else if (e.key === 'Enter') {
      if (inTitleLine) {
        // Handle Enter key in title line - create new normal paragraph
        e.preventDefault();
        
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          // Create new div for content (normal formatting)
          const newDiv = document.createElement('div');
          newDiv.innerHTML = '<br>';
          
          // Insert after the title div
          const firstDiv = contentRef.current?.querySelector('div');
          if (firstDiv && firstDiv.nextSibling) {
            contentRef.current?.insertBefore(newDiv, firstDiv.nextSibling);
          } else if (firstDiv) {
            contentRef.current?.appendChild(newDiv);
          }
          
          // Position cursor in the new div
          const newRange = document.createRange();
          newRange.setStart(newDiv, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
          
          // Trigger content change
          setHasUnsavedChanges(true);
        }
      } else if (inList && currentListItem) {
        // Handle Enter in list
        if (isEmptyListItem(currentListItem)) {
          // Double enter or empty item - exit list
          e.preventDefault();
          document.execCommand('insertUnorderedList', false);
          
          // Create a new paragraph
          const newDiv = document.createElement('div');
          newDiv.innerHTML = '<br>';
          currentListItem.parentElement?.parentNode?.insertBefore(newDiv, currentListItem.parentElement.nextSibling);
          
          // Position cursor in new paragraph
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.setStart(newDiv, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        // For non-empty list items, let browser handle normal list continuation
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (inList) {
        if (e.shiftKey) {
          // Shift+Tab: outdent
          document.execCommand('outdent', false);
        } else {
          // Tab: indent
          document.execCommand('indent', false);
        }
      } else {
        // Normal tab behavior outside lists
        execCommand('indent');
      }
    }
  }, [isInTitleLine, isInList, getCurrentListItem, isEmptyListItem, toggleBulletList, execCommand]);

  const handleContentChange = useCallback(() => {
    ensureTitleFormatting();
    setHasUnsavedChanges(true);
  }, [ensureTitleFormatting]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    insertTextAtCursor(text);
  }, []);

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