import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Entry } from '@/lib/database.types';
import { Mic, MicOff, Trash2, Save } from 'lucide-react';
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  TRANSFORMERS,
  $convertToMarkdownString,
  $convertFromMarkdownString,
} from '@lexical/markdown';
import { $getRoot, $createParagraphNode, $insertNodes, $createTextNode } from 'lexical';

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';

function EditorErrorBoundary({ children, onError }: { children: React.ReactNode; onError: (error: Error) => void }) {
  return <>{children}</>;
}


interface JournalEditorProps {
  entryId?: string;
  onDelete?: () => void;
  onEntryCreated?: (entryId: string, title: string) => void;
  onTitleUpdate?: (title: string) => void;
}

function Placeholder() {
  return (
    <div className="pointer-events-none absolute left-4 top-4 select-none text-muted-foreground">
      Start writing...
    </div>
  );
}

function InitFromMarkdown({ value }: { value?: string }) {
  const [editor] = useLexicalComposerContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (!mounted && value) {
      setMounted(true);
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(value, TRANSFORMERS);
        if (root.getChildrenSize() === 0) {
          root.append($createParagraphNode());
        }
      });
    }
  }, [editor, value, mounted]);

  return null;
}

function SpeechToTextPlugin({ transcript, onReset }: { transcript: string; onReset: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (transcript) {
      editor.update(() => {
        const textNode = $createTextNode(transcript);
        $insertNodes([textNode]);
      });
      onReset();
    }
  }, [transcript, editor, onReset]);

  return null;
}

function EditorContent({ entryId, onDelete, onEntryCreated, onTitleUpdate }: JournalEditorProps) {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentMarkdown, setCurrentMarkdown] = useState('');
  const lastSavedContentRef = useRef<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isListening, transcript, start, stop, reset } = useSpeech();
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else {
      // Set default date for new entries
      const today = new Date();
      const dateString = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const defaultContent = `# ${dateString}\n\n`;
      setCurrentMarkdown(defaultContent);
      lastSavedContentRef.current = defaultContent;
      
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(defaultContent, TRANSFORMERS);
      });
    }
  }, [entryId, editor]);

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
      const content = data.content || '# Untitled Entry\n\n';
      setCurrentMarkdown(content);
      lastSavedContentRef.current = content;
      
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        $convertFromMarkdownString(content, TRANSFORMERS);
      });
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  const extractTitle = (markdown: string) => {
    const lines = markdown.split('\n');
    const firstLine = lines[0] || '';
    // Remove # from markdown heading
    return firstLine.replace(/^#+\s*/, '').trim() || 'Untitled Entry';
  };

  const saveEntry = useCallback(async (markdown: string) => {
    if (!markdown || markdown === lastSavedContentRef.current) return;

    setLoading(true);
    
    try {
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      const title = extractTitle(markdown);
      
      if (entryId) {
        const { error } = await supabase
          .from('entries')
          .update({
            title: title || 'Untitled Entry',
            content: markdown.trim(),
          })
          .eq('id', entryId);

        if (error) throw error;
        
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
            content: markdown.trim(),
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          console.log('New entry created:', data.id);
          onEntryCreated?.(data.id, title);
          toast({
            title: 'Entry Created',
            description: 'Your new entry has been saved.',
          });
        }
      }
      
      lastSavedContentRef.current = markdown;
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
    saveEntry(currentMarkdown);
  }, [saveEntry, currentMarkdown]);

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

  const handleChange = useCallback((editorState: any) => {
    editor.update(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      setCurrentMarkdown(markdown);
      setHasUnsavedChanges(markdown !== lastSavedContentRef.current);
    });
  }, [editor]);

  return (
    <div className="space-y-4 h-full flex flex-col relative">
      <div className="flex-1">
        <div className="min-h-[500px] h-full relative" style={{ paddingBottom: '80px' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[500px] h-full font-mono text-sm focus-visible:outline-none bg-white px-4 py-4 [line-height:1.5]" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={(props: any) => <div>Error loading editor</div>}
          />
          <HistoryPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
          <InitFromMarkdown value={entryId ? undefined : currentMarkdown} />
          <SpeechToTextPlugin transcript={transcript} onReset={reset} />
        </div>
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

export default function JournalEditor(props: JournalEditorProps) {
  const initialConfig = {
    namespace: 'JournalEditor',
    onError(error: Error) {
      console.error(error);
    },
    theme: {
      paragraph: 'mb-2',
      heading: {
        h1: 'text-2xl font-bold mb-2',
        h2: 'text-xl font-bold mb-2',
        h3: 'text-lg font-bold mb-2',
      },
      text: {
        bold: 'font-semibold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
      list: {
        ul: 'list-disc list-inside mb-2',
        ol: 'list-decimal list-inside mb-2',
        nested: {
          listitem: 'ml-4',
        },
      },
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContent {...props} />
    </LexicalComposer>
  );
}
