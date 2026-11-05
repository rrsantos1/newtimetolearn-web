import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  Unlink,
} from "lucide-react";

interface NotebookRichTextEditorProps {
  initialContent?: JSONContent;
  onChange: (content: JSONContent) => void;
  readOnly?: boolean;
}

const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px"];

export function NotebookRichTextEditor({
  initialContent,
  onChange,
  readOnly = false,
}: NotebookRichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true, linkOnPaste: true } }),
      TextStyle,
      FontSize,
    ],
    content: initialContent ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editable: !readOnly,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getJSON()),
  });

  if (!editor) return <div className="min-h-24 animate-pulse rounded-lg bg-[#f8f4e9]" />;

  function applyLink(): void {
    const normalizedUrl = linkUrl.trim();
    if (!normalizedUrl) return;
    try {
      const url = new URL(normalizedUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      editor.chain().focus().setLink({ href: url.toString() }).run();
      setLinkUrl("");
    } catch {
      setLinkUrl("");
    }
  }

  const toolClass = "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#c8b994] bg-white text-[#51452f] transition hover:bg-[#f5efdf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b6b2e] disabled:opacity-40";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {!readOnly && (
        <div
          role="toolbar"
          aria-label="Formatação do texto"
          className="flex flex-wrap gap-1 rounded-xl border border-[#d8c9a9] bg-[#f5efdf] p-2 sm:w-14 sm:flex-col sm:items-center"
        >
          <button type="button" aria-label="Negrito" title="Negrito" aria-pressed={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} className={toolClass}>
            <Bold size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Itálico" title="Itálico" aria-pressed={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} className={toolClass}>
            <Italic size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Sublinhado" title="Sublinhado" aria-pressed={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolClass}>
            <UnderlineIcon size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Lista com marcadores" title="Lista com marcadores" aria-pressed={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolClass}>
            <List size={17} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Lista numerada" title="Lista numerada" aria-pressed={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolClass}>
            <ListOrdered size={17} aria-hidden="true" />
          </button>
          <label className="sr-only" htmlFor="notebook-font-size">Tamanho da fonte</label>
          <select
            id="notebook-font-size"
            aria-label="Tamanho da fonte"
            defaultValue="16px"
            onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
            className="h-9 w-[4.5rem] rounded-lg border border-[#c8b994] bg-white px-1 text-xs font-semibold text-[#51452f] sm:w-11"
          >
            {fontSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:w-full sm:flex-col">
            <label className="sr-only" htmlFor="notebook-link-url">Endereço do link</label>
            <input
              id="notebook-link-url"
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://..."
              className="h-9 min-w-0 flex-1 rounded-lg border border-[#c8b994] bg-white px-2 text-xs text-[#51452f] sm:w-full"
            />
            <button type="button" aria-label="Inserir link" title="Inserir link" onClick={applyLink} disabled={!linkUrl.trim()} className={toolClass}>
              <Link2 size={16} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Remover link" title="Remover link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")} className={toolClass}>
              <Unlink size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
      <div className="min-h-32 min-w-0 flex-1 rounded-lg border border-[#d8c9a9] bg-white/70 px-4 py-3 text-sm leading-7 text-[#51452f] focus-within:ring-2 focus-within:ring-[#b69b60]/30">
        <EditorContent
          editor={editor}
          className="notebook-rich-editor min-h-28 outline-none [&_.tiptap]:min-h-28 [&_.tiptap]:outline-none [&_.tiptap_p]:my-1 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_a]:text-blue-700 [&_.tiptap_a]:underline"
        />
      </div>
    </div>
  );
}
