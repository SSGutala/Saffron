"use client";

import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  HighlighterIcon,
  ItalicIcon,
  ListIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WordEditorProps {
  html: string;
  onChange: (html: string) => void;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "h-8 min-w-8 px-2 rounded-md border text-sm font-semibold transition-colors",
        "bg-white text-gray-800 border-gray-300 shadow-sm hover:bg-gray-50",
        active && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
      )}
    >
      {children}
    </button>
  );
}

export function WordEditor({ html, onChange }: WordEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content: html || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[10in] focus:outline-none px-16 py-14 text-[15px] leading-[1.65] text-gray-900 break-words",
        style: "word-wrap: break-word; overflow-wrap: break-word;",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html || "<p></p>");
    }
  }, [html, editor]);

  if (!editor) return null;

  return (
    <div className="h-full flex flex-col bg-[#e8eaed]">
      <div className="flex gap-1.5 p-2 border-b bg-white shrink-0 flex-wrap items-center shadow-sm">
        <span className="text-xs font-medium text-gray-500 mr-2">Edit document</span>
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <HighlighterIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon className="size-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-4" />
        </ToolbarButton>
      </div>
      <div className="flex-1 overflow-auto p-8">
        <div
          className="max-w-[816px] mx-auto bg-white shadow-xl min-h-[11in] border border-gray-200"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
