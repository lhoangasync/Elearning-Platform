"use client";

import React, { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Menubar } from "./Menubar";
import TextAlign from "@tiptap/extension-text-align";

interface RichTextEditorProps {
  field: any;
  minHeight?: string;
  placeholder?: string;
}

export function RichTextEditor({
  field,
  minHeight = "300px",
  placeholder = "Text something!",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: `p-4 focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-lg dark:prose-invert !w-full !max-w-none`,
        style: `min-height: ${minHeight}`,
      },
    },

    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML());
    },

    content: field.value || `<p>${placeholder}</p>`,
  });

  useEffect(() => {
    if (editor && field.value !== editor.getHTML()) {
      editor.commands.setContent(field.value || `<p>${placeholder}</p>`);
    }
  }, [field.value, editor, placeholder]);

  return (
    <div className="w-full border border-input rounded-lg overflow-hidden dark:bg-input/30">
      <Menubar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
