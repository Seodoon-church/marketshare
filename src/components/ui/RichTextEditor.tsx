'use client';

import { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/* ------------------------------------------------------------------ */
/*  Toolbar Button                                                     */
/* ------------------------------------------------------------------ */

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors',
        'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'disabled:pointer-events-none disabled:opacity-40',
        isActive && 'bg-gray-200 text-gray-900',
        !isActive && 'text-gray-600'
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-gray-200" />;
}

/* ------------------------------------------------------------------ */
/*  Link Input Popover                                                 */
/* ------------------------------------------------------------------ */

interface LinkInputProps {
  initialUrl?: string;
  onSubmit: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}

function LinkInput({ initialUrl = '', onSubmit, onRemove, onCancel }: LinkInputProps) {
  const [url, setUrl] = useState(initialUrl);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="h-8 w-56 rounded-md border border-gray-300 px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (url) onSubmit(url);
          }
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
      />
      <button
        type="button"
        onClick={() => url && onSubmit(url)}
        className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary-dark"
      >
        확인
      </button>
      {initialUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="h-8 rounded-md bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          삭제
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="h-8 rounded-md px-3 text-xs font-medium text-gray-500 hover:bg-gray-100"
      >
        취소
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image URL Input                                                    */
/* ------------------------------------------------------------------ */

interface ImageInputProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
}

function ImageInput({ onSubmit, onCancel }: ImageInputProps) {
  const [url, setUrl] = useState('');

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="이미지 URL을 입력하세요"
        className="h-8 w-64 rounded-md border border-gray-300 px-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (url) onSubmit(url);
          }
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
      />
      <button
        type="button"
        onClick={() => url && onSubmit(url)}
        className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary-dark"
      >
        삽입
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-8 rounded-md px-3 text-xs font-medium text-gray-500 hover:bg-gray-100"
      >
        취소
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar Icons (simple SVG)                                         */
/* ------------------------------------------------------------------ */

function BoldIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zm0 8h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4c-.5-1.5-2.5-3-5-3-3 0-5 2-5 4.5 0 3 2.5 4 5 4.5" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M8 20c.5 1.5 2.5 3 5 3 3 0 5-2 5-4.5 0-3-2.5-4-5-4.5" />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="5" cy="6" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <text x="4" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
      <text x="4" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
      <text x="4" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar                                                            */
/* ------------------------------------------------------------------ */

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
  onLinkClick: () => void;
  onImageClick: () => void;
}

function Toolbar({ editor, onLinkClick, onImageClick }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-3 py-2">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="굵게 (Ctrl+B)"
      >
        <BoldIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="기울임 (Ctrl+I)"
      >
        <ItalicIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="밑줄 (Ctrl+U)"
      >
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="취소선"
      >
        <StrikethroughIcon />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      >
        <span className="text-xs font-bold">H1</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      >
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      >
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="글머리 기호 목록"
      >
        <BulletListIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="번호 매기기 목록"
      >
        <OrderedListIcon />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link & Image */}
      <ToolbarButton
        onClick={onLinkClick}
        isActive={editor.isActive('link')}
        title="링크"
      >
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={onImageClick}
        title="이미지"
      >
        <ImageIcon />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Align */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="왼쪽 정렬"
      >
        <AlignLeftIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="가운데 정렬"
      >
        <AlignCenterIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="오른쪽 정렬"
      >
        <AlignRightIcon />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="실행 취소 (Ctrl+Z)"
      >
        <UndoIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="다시 실행 (Ctrl+Shift+Z)"
      >
        <RedoIcon />
      </ToolbarButton>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RichTextEditor                                                     */
/* ------------------------------------------------------------------ */

export function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary-dark',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-gray-400 before:float-left before:h-0 before:pointer-events-none',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none px-4 py-3 focus:outline-none',
          'prose-headings:font-semibold prose-headings:text-gray-900',
          'prose-p:text-gray-700 prose-p:leading-relaxed',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'prose-img:rounded-lg prose-img:mx-auto',
          'prose-ul:list-disc prose-ol:list-decimal',
          'prose-li:text-gray-700',
          'prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:text-gray-600'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    immediatelyRender: false,
  });

  /* ---- Link handling ---- */

  const handleLinkClick = useCallback(() => {
    if (!editor) return;

    if (editor.isActive('link')) {
      // Already has a link -- show editor to modify
      setShowLinkInput(true);
    } else if (editor.state.selection.empty) {
      // No selection -- still show input to wrap cursor position
      setShowLinkInput(true);
    } else {
      setShowLinkInput(true);
    }
  }, [editor]);

  const handleSetLink = useCallback(
    (url: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
      setShowLinkInput(false);
    },
    [editor]
  );

  const handleRemoveLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  /* ---- Image handling ---- */

  const handleImageClick = useCallback(() => {
    setShowImageInput(true);
  }, []);

  const handleInsertImage = useCallback(
    (url: string) => {
      if (!editor) return;
      editor.chain().focus().setImage({ src: url }).run();
      setShowImageInput(false);
    },
    [editor]
  );

  if (!editor) {
    return (
      <div
        className="animate-pulse rounded-xl border border-gray-200 bg-gray-50"
        style={{ minHeight }}
      />
    );
  }

  const currentLinkUrl = editor.isActive('link')
    ? (editor.getAttributes('link').href as string)
    : '';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      {/* Toolbar */}
      <Toolbar
        editor={editor}
        onLinkClick={handleLinkClick}
        onImageClick={handleImageClick}
      />

      {/* Inline inputs for link / image */}
      {showLinkInput && (
        <div className="border-b border-gray-200 px-3 py-2">
          <LinkInput
            initialUrl={currentLinkUrl}
            onSubmit={handleSetLink}
            onRemove={handleRemoveLink}
            onCancel={() => setShowLinkInput(false)}
          />
        </div>
      )}

      {showImageInput && (
        <div className="border-b border-gray-200 px-3 py-2">
          <ImageInput
            onSubmit={handleInsertImage}
            onCancel={() => setShowImageInput(false)}
          />
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
