"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface WordEditorProps {
  html: string;
  onChange: (html: string) => void;
}

export function WordEditor({ html, onChange }: WordEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: html || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[60vh] focus:outline-none px-12 py-10 bg-white text-gray-900 shadow-inner",
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
    <div className="h-full flex flex-col bg-zinc-200">
      <div className="flex gap-1 p-2 border-b bg-white shrink-0 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "default" : "outline"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[816px] mx-auto bg-white shadow-lg min-h-[11in] border">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
