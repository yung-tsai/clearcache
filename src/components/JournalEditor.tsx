import React, { useEffect } from 'react';
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import {
  TRANSFORMERS,
  $convertToMarkdownString,
  $convertFromMarkdownString,
} from '@lexical/markdown';

import { $getRoot, $createParagraphNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';

/**
 * Lexical editor for your "New Entry" screen.
 *
 * Behaviors:
 * - First line is always an H1 (Title)
 * - "- ", "* ", "1. " at line start → auto-create bullet/ordered lists
 * - Enter → new list item; Enter on empty item → exit list
 * - Tab / Shift+Tab in lists → indent / outdent
 * - Undo/Redo, history
 * - Markdown shortcuts for common formatting
 *
 * Props
 * - value: optional initial Markdown content
 * - onChange: ({ title, markdown, editorStateJSON })
 * - placeholder: placeholder text
 */

export type JournalEditorProps = {
  value?: string;
  onChange?: (payload: { title: string; markdown: string; editorStateJSON: string }) => void;
  placeholder?: string;
  className?: string;
};

function Placeholder({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 select-none text-muted-foreground">
      {text}
    </div>
  );
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export default function JournalEditor({
  value,
  onChange,
  placeholder = 'New entry…',
  className = '',
}: JournalEditorProps) {
  const initialConfig = React.useMemo(
    () => ({
      namespace: 'clearcache',
      onError(error: Error) {
        console.error(error);
      },
      theme: {
        paragraph: 'mb-2',
        heading: {
          h1: 'mb-2 text-3xl font-bold tracking-tight',
        },
        text: {
          bold: 'font-semibold',
          italic: 'italic',
          underline: 'underline',
          strikethrough: 'line-through',
          code: 'rounded bg-muted px-1 py-0.5 font-mono text-sm',
        },
        list: {
          nested: {
            listitem: 'ml-4',
          },
        },
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode],
    }),
    []
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={`relative rounded-2xl border bg-background p-4 shadow-sm focus-within:ring-2 focus-within:ring-ring ${className}`}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-64 w-full outline-none [line-height:1.6] prose prose-neutral max-w-none dark:prose-invert"
            />
          }
          placeholder={<Placeholder text={placeholder} />}
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <AutoFocusPlugin />

        <OnChangePlugin
          onChange={(editorState, editor) => {
            if (!onChange) return;
            editor.update(() => {
              const root = $getRoot();
              const first = root.getFirstChild();
              let title = '';
              if (first) {
                try {
                  const { $createHeadingNode } = require('@lexical/rich-text');
                  // @ts-ignore
                  if (first.getType && first.getType() !== 'heading') {
                    // @ts-ignore
                    const children = first.getChildren?.() || [];
                    const h1 = $createHeadingNode('h1');
                    first.replace(h1);
                    h1.append(...children);
                    title = h1.getTextContent();
                  } else {
                    // @ts-ignore
                    if (first.setTag) first.setTag('h1');
                    title = first.getTextContent();
                  }
                } catch {
                  title = first.getTextContent();
                }
              }
              const markdown = $convertToMarkdownString(TRANSFORMERS);
              const json = JSON.stringify(editorState.toJSON());
              onChange({ title: (title || '').trim(), markdown, editorStateJSON: json });
            });
          }}
        />

        <InitFromMarkdown value={value} />
      </div>
    </LexicalComposer>
  );
}

function InitFromMarkdown({ value }: { value?: string }) {
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <OnChangePlugin
      ignoreSelectionChange
      onChange={(_, editor) => {
        if (!mounted || !value) return;
        setMounted(false);
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          $convertFromMarkdownString(value, TRANSFORMERS);
          if (root.getChildrenSize() === 0) {
            root.append($createParagraphNode());
          }
        });
      }}
    />
  );
}
