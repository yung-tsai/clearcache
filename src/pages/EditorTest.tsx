import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TRANSFORMERS, $convertFromMarkdownString } from "@lexical/markdown";
import { $getRoot, $createParagraphNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";

function InitSample() {
  const [editor] = useLexicalComposerContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const md = `
Simple bullets:

- Alpha
- Beta
- Gamma

Nested bullets:

- Parent
  - Child A
  - Child B

Numbers:

1. One
2. Two
3. Three

Nested numbers:

1. Parent
   1. Child 1
   2. Child 2
`;
        $convertFromMarkdownString(md, TRANSFORMERS);
        if (root.getChildrenSize() === 0) {
          root.append($createParagraphNode());
        }
      });
    }
  }, [editor, mounted]);
  return null;
}

export default function EditorTest() {
  const initialConfig = {
    namespace: "EditorTest",
    onError(error: Error) {
      console.error(error);
    },
    theme: {
      paragraph: "",
      heading: {
        h1: "text-2xl font-bold mb-2",
        h2: "text-xl font-bold mb-2",
        h3: "text-lg font-bold mb-2",
      },
      text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
      },
      // intentionally no list block here
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
    ],
  } as const;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Editor List Rendering Test</h1>
      <div className="border border-black bg-white">
        <LexicalComposer initialConfig={initialConfig}>
          <div className="min-h-[320px]">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="journal-editor h-full font-sans focus-visible:outline-none bg-white p-4 [line-height:1.5] min-h-[320px]"
                  style={{ fontSize: "18px" }}
                />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <InitSample />
          </div>
        </LexicalComposer>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">This page is temporary and used to verify bullet/number rendering.</p>
    </div>
  );
}
