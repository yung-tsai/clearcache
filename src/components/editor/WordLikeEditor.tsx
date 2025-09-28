import React, { useEffect } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
// import History from '@tiptap/extension-history';
// import HardBreak from '@tiptap/extension-hard-break';
import { keymap } from 'prosemirror-keymap';
import { sinkListItem, liftListItem } from 'prosemirror-schema-list';
import { Button } from '@/components/ui/button';
import { Extension } from '@tiptap/core';

interface WordLikeEditorProps {
  value: string;
  onChange: (html: string) => void;
  onReady?: (editor: Editor) => void;
  className?: string;
}

// Disable input rules that auto-convert "- " or "1. " to lists
const BulletListNoInputRules = BulletList.extend({
  addInputRules() {
    return [];
  },
});
const OrderedListNoInputRules = OrderedList.extend({
  addInputRules() {
    return [];
  },
});

const WordLikeListKeymap = Extension.create({
  name: 'wordLikeListKeymap',
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      keymap({
        Tab: (state, dispatch, view) => {
          const li = state.schema.nodes.listItem;
          return sinkListItem(li)(state, dispatch, view);
        },
        'Shift-Tab': (state, dispatch, view) => {
          const li = state.schema.nodes.listItem;
          return liftListItem(li)(state, dispatch, view);
        },
        Enter: (state, dispatch, view) => {
          const { $from } = state.selection;
          const liType = state.schema.nodes.listItem;
          const inListItem = $from.parent.type === liType;
          if (!inListItem) return false;

          const isEmptyItem = $from.parent.content.size === 0;
          if (isEmptyItem) {
            // Exit the list when pressing Enter on empty item
            return liftListItem(liType)(state, dispatch, view);
          }

          // Otherwise split to a new list item (continue list)
          return editor.commands.splitListItem('listItem');
        },
        'Shift-Enter': () => {
          return editor.commands.setHardBreak();
        },
      }),
    ];
  },
});

export default function WordLikeEditor({ value, onChange, onReady, className }: WordLikeEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        hardBreak: { keepMarks: true },
      }),
      BulletListNoInputRules,
      OrderedListNoInputRules,
      ListItem,
      WordLikeListKeymap,
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose max-w-none outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      onReady?.(editor);
    },
  });

  // Keep editor in sync with external value
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => () => editor?.destroy(), [editor]);

  if (!editor) return null;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Bold" data-active={editor.isActive('bold')}>
          B
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic" data-active={editor.isActive('italic')}>
          I
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet list" data-active={editor.isActive('bulletList')}>
          • List
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered list" data-active={editor.isActive('orderedList')}>
          1. List
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} aria-label="Undo">
          Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} aria-label="Redo">
          Redo
        </Button>
      </div>
      <div className="mt-3 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
