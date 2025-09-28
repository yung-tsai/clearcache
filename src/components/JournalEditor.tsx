import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Entry } from '@/lib/database.types';
import { Mic, MicOff, Trash2, Save } from 'lucide-react';

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
  const contentRef = useRef<HTMLDivElement>(null);
  const lastSavedContentRef = useRef<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isListening, transcript, start, stop, reset } = useSpeech();

  // Track last empty LI to support double-Enter to exit list
  const lastEmptyLIRef = useRef<HTMLLIElement | null>(null);

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
          const defaultContent = `<div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">${dateString}</div><div><br></div>`;
          contentRef.current.innerHTML = defaultContent;
          lastSavedContentRef.current = defaultContent;
          
          // Position cursor at the end of title
          const range = document.createRange();
          const sel = window.getSelection();
          const firstDiv = contentRef.current.querySelector('div');
          if (firstDiv && firstDiv.firstChild) {
            range.setStartAfter(firstDiv.firstChild);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
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
        const content = data.content || '<div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Untitled Entry</div><div><br></div>';
        contentRef.current.innerHTML = content;
        lastSavedContentRef.current = content;
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
  }, [entryId, user?.id, toast, onEntryCreated, onTitleUpdate]);

  const handleSave = useCallback(() => {
    if (contentRef.current) {
      const htmlContent = contentRef.current.innerHTML;
      saveEntry(htmlContent);
    }
  }, [saveEntry]);

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

  // Word-like list management helpers
  const getSelection = () => window.getSelection();

  const getClosest = useCallback((node: Node | null, tag: string): HTMLElement | null => {
    let cur: Node | null = node;
    while (cur && cur.nodeType !== Node.ELEMENT_NODE) cur = cur.parentNode;
    let el: HTMLElement | null = (cur as HTMLElement) || null;
    while (el && el.tagName !== tag) el = el.parentElement;
    return el;
  }, []);

  const getCurrentLI = useCallback((): HTMLLIElement | null => {
    const sel = getSelection();
    if (!sel || !sel.rangeCount) return null;
    return getClosest(sel.getRangeAt(0).commonAncestorContainer, 'LI') as HTMLLIElement | null;
  }, [getClosest]);

  const getCurrentBlockDiv = useCallback((): HTMLDivElement | null => {
    const sel = getSelection();
    if (!sel || !sel.rangeCount) return null;
    return getClosest(sel.getRangeAt(0).commonAncestorContainer, 'DIV') as HTMLDivElement | null;
  }, [getClosest]);

  const isInList = useCallback(() => !!getCurrentLI(), [getCurrentLI]);

  const moveCursorToStart = (el: HTMLElement) => {
    const sel = getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    contentRef.current?.focus();
  };

  const insertParagraphAfter = (node: HTMLElement) => {
    const para = document.createElement('div');
    para.innerHTML = '<br>';
    node.parentNode?.insertBefore(para, node.nextSibling);
    moveCursorToStart(para);
    setHasUnsavedChanges(true);
    return para;
  };

  const insertNewLIAfter = (li: HTMLLIElement) => {
    const newLI = document.createElement('li');
    newLI.innerHTML = '<br>';
    li.parentElement?.insertBefore(newLI, li.nextSibling);
    moveCursorToStart(newLI);
    setHasUnsavedChanges(true);
    return newLI;
  };

  const cleanupEmptyUL = (ul: HTMLUListElement) => {
    if (ul && ul.children.length === 0) {
      ul.parentElement?.removeChild(ul);
    }
  };

  const exitListToParagraph = (li: HTMLLIElement) => {
    const ul = li.parentElement as HTMLUListElement | null;
    if (!ul) return;

    // Move following siblings into a new UL to split the list
    const following = [] as HTMLLIElement[];
    let sib = li.nextElementSibling as HTMLLIElement | null;
    while (sib) {
      const next = sib.nextElementSibling as HTMLLIElement | null;
      following.push(sib);
      sib = next;
    }

    // Remove current LI from UL
    ul.removeChild(li);

    // Insert paragraph after current UL
    const para = insertParagraphAfter(ul);

    // If there are following items, create a new UL after paragraph and append them
    if (following.length) {
      const newUL = document.createElement('ul');
      following.forEach((liNode) => newUL.appendChild(liNode));
      para.parentNode?.insertBefore(newUL, para.nextSibling);
    }

    // Clean up original UL if empty
    cleanupEmptyUL(ul);

    lastEmptyLIRef.current = null;
    moveCursorToStart(para);
    setHasUnsavedChanges(true);
  };

  const indentLI = (li: HTMLLIElement) => {
    const prev = li.previousElementSibling as HTMLLIElement | null;
    if (!prev) return; // can't indent first item
    let subUL = Array.from(prev.children).find((c) => (c as HTMLElement).tagName === 'UL') as HTMLUListElement | undefined;
    if (!subUL) {
      subUL = document.createElement('ul');
      prev.appendChild(subUL);
    }
    li.parentElement?.removeChild(li);
    subUL.appendChild(li);
    moveCursorToStart(li);
    setHasUnsavedChanges(true);
  };

  const outdentLI = (li: HTMLLIElement) => {
    const parentUL = li.parentElement as HTMLUListElement | null;
    const parentLI = parentUL?.parentElement as HTMLLIElement | null;
    if (!parentUL || !parentLI) return; // already top-level
    const grandUL = parentLI.parentElement as HTMLUListElement | null;
    parentUL.removeChild(li);
    grandUL?.insertBefore(li, parentLI.nextSibling);
    cleanupEmptyUL(parentUL);
    moveCursorToStart(li);
    setHasUnsavedChanges(true);
  };

  const getTextBeforeCursorInNode = (node: HTMLElement) => {
    const sel = getSelection();
    if (!sel || !sel.rangeCount) return '';
    const range = sel.getRangeAt(0);
    const tmp = document.createRange();
    tmp.selectNodeContents(node);
    tmp.setEnd(range.startContainer, range.startOffset);
    return tmp.toString();
  };

  const convertDashLineToList = () => {
    const block = getCurrentBlockDiv();
    if (!block) return;
    const before = getTextBeforeCursorInNode(block);
    if (/^\s*-$/.test(before)) {
      const ul = document.createElement('ul');
      const li = document.createElement('li');
      li.innerHTML = '<br>';
      ul.appendChild(li);
      block.parentElement?.replaceChild(ul, block);
      moveCursorToStart(li);
      setHasUnsavedChanges(true);
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const inTitleLine = isInTitleLine();

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
      }
      return;
    }

    if (e.key === 'Enter') {
      if (inTitleLine) {
        // Create a new normal paragraph right after the title
        e.preventDefault();
        const firstDiv = contentRef.current?.querySelector('div');
        const newDiv = document.createElement('div');
        newDiv.innerHTML = '<br>';
        if (firstDiv && firstDiv.nextSibling) {
          contentRef.current?.insertBefore(newDiv, firstDiv.nextSibling);
        } else if (firstDiv) {
          contentRef.current?.appendChild(newDiv);
        }
        moveCursorToStart(newDiv);
        setHasUnsavedChanges(true);
        return;
      }

      const currentLI = getCurrentLI();
      if (currentLI) {
        e.preventDefault();
        const hasContent = (currentLI.textContent || '').trim().length > 0;
        if (hasContent) {
          // Enter on non-empty bullet -> continue with another bullet
          const newLI = insertNewLIAfter(currentLI);
          lastEmptyLIRef.current = newLI; // next Enter on empty should exit
        } else {
          // Enter on empty bullet
          if (lastEmptyLIRef.current === currentLI) {
            // Double Enter on empty bullet -> exit to normal paragraph
            exitListToParagraph(currentLI);
          } else {
            // First Enter on empty bullet -> keep it, track for next Enter
            lastEmptyLIRef.current = currentLI;
          }
        }
        return;
      }

      // Not in a list: reset tracking and allow default
      lastEmptyLIRef.current = null;
      return;
    }

    if (e.key === 'Tab') {
      const currentLI = getCurrentLI();
      if (currentLI) {
        e.preventDefault();
        if (e.shiftKey) outdentLI(currentLI);
        else indentLI(currentLI);
      }
      return;
    }

    if (e.key === ' ') {
      // Only convert dash to bullet at line start and not in title or existing list
      if (!inTitleLine && !isInList()) {
        const block = getCurrentBlockDiv();
        if (block) {
          const before = getTextBeforeCursorInNode(block);
          if (/^\s*-$/.test(before)) {
            e.preventDefault();
            convertDashLineToList();
            return;
          }
        }
      }
    }

    // Any other key resets double-enter tracking
    lastEmptyLIRef.current = null;
  }, [isInTitleLine, execCommand, getCurrentLI, getCurrentBlockDiv, isInList]);

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
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="min-h-[500px] h-full font-mono resize-none bg-white text-sm focus-visible:outline-none"
          style={{ lineHeight: '1.5', paddingBottom: '80px' }} // Add padding for fixed button
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
