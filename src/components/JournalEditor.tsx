import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSpeech } from '@/hooks/useSpeech';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Entry } from '@/lib/database.types';
import { Mic, MicOff, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
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
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}


interface JournalEditorProps {
  entryId?: string;
  onDelete?: () => void;
  onEntryCreated?: (entryId: string, title: string) => void;
  onTitleUpdate?: (title: string) => void;
  onInfoChange?: (info: { createdAt: string; wordCount: number }) => void;
}

function Placeholder() {
  return (
    <div className="pointer-events-none absolute left-4 top-4 select-none text-muted-foreground font-mono text-sm">
      write what's on your mind and clear your cache
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

function EditorContent({ entryId, onDelete, onEntryCreated, onTitleUpdate, onInfoChange }: JournalEditorProps) {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [title, setTitle] = useState('Untitled');
  const [currentMarkdown, setCurrentMarkdown] = useState('');
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString());
  const lastSavedContentRef = useRef<string>('');
  const lastSavedTitleRef = useRef<string>('Untitled');
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isListening, transcript, start, stop, reset } = useSpeech();
  const { playSound } = useSoundEffects();
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (entryId) {
      loadEntry(entryId);
    } else {
      // Set default for new entries
      setTitle('Untitled');
      setCreatedAt(new Date().toISOString());
      lastSavedTitleRef.current = 'Untitled';
      
      // Auto-focus the editor for new entries after animation
      setTimeout(() => {
        editor.focus();
      }, 100);
    }
  }, [entryId, editor]);

  // Notify parent of info changes for the info bar
  useEffect(() => {
    if (onInfoChange) {
      onInfoChange({
        createdAt,
        wordCount: getWordCount(currentMarkdown)
      });
    }
  }, [createdAt, currentMarkdown, onInfoChange]);

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
      const entryTitle = data.title || 'Untitled';
      const content = data.content || '';
      setTitle(entryTitle);
      setCreatedAt(data.created_at);
      setCurrentMarkdown(content);
      lastSavedContentRef.current = content;
      lastSavedTitleRef.current = entryTitle;
      
      if (content) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          $convertFromMarkdownString(content, TRANSFORMERS);
        });
      }
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  const saveEntry = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in to save your entry.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const userId = user.id;
      const finalTitle = title.trim() || 'Untitled';
      const finalContent = currentMarkdown.trim();
      
      if (entryId) {
        const { error } = await supabase
          .from('entries')
          .update({
            title: finalTitle,
            content: finalContent,
          })
          .eq('id', entryId);

        if (error) throw error;
        
        onTitleUpdate?.(finalTitle);
        
        toast({
          title: 'Saved',
          description: 'Your entry has been saved.',
        });
      } else {
        const { data, error } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            title: finalTitle,
            content: finalContent,
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          console.log('New entry created:', data.id);
          onEntryCreated?.(data.id, finalTitle);
          toast({
            title: 'Entry Created',
            description: 'Your new entry has been saved.',
          });
        }
      }
      
      lastSavedContentRef.current = finalContent;
      lastSavedTitleRef.current = finalTitle;
      
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
  }, [entryId, user?.id, toast, onEntryCreated, onTitleUpdate, title, currentMarkdown]);

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
    });
  }, [editor]);

  const getWordCount = (markdown: string) => {
    if (!markdown) return 0;
    
    let text = markdown
      .replace(/^#{1,6}\s+/gm, '')              // Remove headers
      .replace(/(\*\*|__)(.*?)\1/g, '$2')      // Remove bold
      .replace(/(\*|_)(.*?)\1/g, '$2')         // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/`([^`]+)`/g, '$1')             // Remove inline code
      .replace(/```[\s\S]*?```/g, '')          // Remove code blocks
      .replace(/^[\s]*[-*+]\s+/gm, '')         // Remove bullets
      .replace(/^[\s]*\d+\.\s+/gm, '')         // Remove numbered lists
      .replace(/^>\s+/gm, '')                  // Remove blockquotes
      .replace(/^[-*_]{3,}\s*$/gm, '')         // Remove horizontal rules
      .trim();
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEE, MMM d, yyyy');
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Title Input */}
      <div className="bg-white px-4 pt-4">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={() => playSound('keyPress')}
          placeholder="Untitled"
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-white rounded-none p-0"
          style={{ 
            fontFamily: 'Trispace, sans-serif',
            fontWeight: 600,
            fontSize: '24px'
          }}
        />
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-y-auto scrollbar-autohide mb-16 px-4">
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="journal-editor h-full focus-visible:outline-none bg-white p-0 [line-height:1.5] min-h-[400px]"
              style={{ 
                fontFamily: 'Space Mono, monospace',
                fontSize: '16px'
              }}
              onKeyDown={() => {
                playSound('keyPress');
              }}
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        <SpeechToTextPlugin transcript={transcript} onReset={reset} />
      </div>

      {/* Fixed Mac-style toolbar at bottom */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-2 flex gap-2 items-center bg-white"
      >
        {isSupported && (
          <Button
            type="button"
            onClick={handleMicToggle}
            disabled={loading}
            className="mac-button hidden items-center gap-2 text-xs"
            style={{
              boxShadow: isListening 
                ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' 
                : '2px 2px 0px rgba(0,0,0,1)'
            }}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            {isListening ? 'Stop' : 'Mic'}
          </Button>
        )}

        {entryId && (
          <Button
            type="button"
            onClick={() => {
              playSound('buttonClick');
              handleDelete();
            }}
            disabled={loading}
            className="border border-black bg-white text-black hover:bg-white active:shadow-none transition-none"
            style={{
              width: '62px',
              height: '36px',
              padding: '5px',
              boxShadow: 'rgb(0, 0, 0) 3px 3px 0px',
              fontFamily: 'Trispace, sans-serif',
              fontSize: '20px',
              lineHeight: '26px',
              letterSpacing: '-0.004em',
              color: '#000000'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = 'rgb(0, 0, 0) 3px 3px 0px';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'rgb(0, 0, 0) 3px 3px 0px';
            }}
          >
            Delete
          </Button>
        )}
        
        <Button
          type="button"
          onClick={() => {
            playSound('buttonClick');
            saveEntry();
          }}
          disabled={loading}
          className="ml-auto border border-black bg-white text-black hover:bg-white active:shadow-none transition-none"
          style={{
            width: '62px',
            height: '36px',
            padding: '5px',
            boxShadow: 'rgb(0, 0, 0) 3px 3px 0px',
            fontFamily: 'Trispace, sans-serif',
            fontSize: '20px',
            lineHeight: '26px',
            letterSpacing: '-0.004em',
            color: '#000000'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.boxShadow = 'rgb(0, 0, 0) 3px 3px 0px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'rgb(0, 0, 0) 3px 3px 0px';
          }}
        >
          Save
        </Button>

        {isListening && (
          <span className="ml-auto text-xs font-mono">
            🎤 Listening...
          </span>
        )}
      </div>
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
      paragraph: '',
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
    },
    nodes: [
      HeadingNode, 
      QuoteNode, 
      ListNode, 
      ListItemNode, 
      CodeNode, 
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorContent {...props} />
    </LexicalComposer>
  );
}
