import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { 
  TextB, 
  TextItalic, 
  TextStrikethrough, 
  TextAlignLeft, 
  TextAlignCenter, 
  TextAlignRight, 
  TextAlignJustify,
  ListBullets, 
  ListNumbers, 
  Quotes, 
  Image as ImageIcon, 
  Eye, 
  BookOpen, 
  Sparkle, 
  FloppyDisk,
  BookmarkSimple,
  Clock,
  ArrowsOut,
  ArrowsIn
} from '@phosphor-icons/react';

const FONT_OPTIONS = [
  { id: 'merriweather', name: 'Literária (Merriweather)', className: 'font-merriweather' },
  { id: 'jakarta', name: 'Moderna (Plus Jakarta)', className: 'font-jakarta' },
  { id: 'caveat', name: 'Manuscrita (Caveat)', className: 'font-caveat text-lg' }
];

const PASTEL_HIGHLIGHTS = [
  { label: 'Rosa Amor', color: '#FBCFE8' },
  { label: 'Dourado Estelar', color: '#FEF08A' },
  { label: 'Azul Sonho', color: '#BAE6FD' },
  { label: 'Verde Carinho', color: '#A7F3D0' }
];

export default function RichStoryEditor({
  content = '',
  onChange,
  onWordCountChange,
  draftKey = 'story_draft_content',
  placeholder = 'Comece a escrever nossa história aqui com todo o seu amor...'
}) {
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentChapter, setCurrentChapter] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Image.configure({
        inline: false,
        allowBase64: true
      }),
      Placeholder.configure({
        placeholder
      }),
      CharacterCount
    ],
    content: content || localStorage.getItem(draftKey) || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
      const words = editor.storage.characterCount.words();
      onWordCountChange?.(words);
    }
  });

  // Autosave a cada 2 segundos no localStorage
  useEffect(() => {
    if (!editor) return;

    const interval = setInterval(() => {
      const html = editor.getHTML();
      if (html && html !== '<p></p>') {
        localStorage.setItem(draftKey, html);
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [editor, draftKey]);

  // Inserção de imagem inline via URL ou upload local Base64
  const addInlineImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const url = readerEvent.target.result;
          if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  // Inserir divisória de capítulo estilizada estilo Wattpad
  const insertChapterHeader = () => {
    if (!editor) return;
    const chapName = currentChapter.trim() || `Capítulo ${Math.floor(Math.random() * 90) + 1}`;
    editor.chain().focus()
      .setHorizontalRule()
      .insertContent(`<h2>✨ ${chapName} ✨</h2><p></p>`)
      .run();
    setCurrentChapter('');
  };

  if (!editor) return null;

  const wordsCount = editor.storage.characterCount.words();
  const readingTimeMinutes = Math.max(1, Math.ceil(wordsCount / 180));

  return (
    <div className={`relative transition-all duration-300 ${
      isFocusMode 
        ? 'fixed inset-0 z-50 bg-[#120D1D] text-white p-6 sm:p-12 overflow-y-auto flex flex-col items-center'
        : 'w-full rounded-2xl border border-white/10 bg-black/25 overflow-hidden'
    }`}>
      {/* BARRA SUPERIOR / CONTADOR DE LEITURA & MODO WATTPAD */}
      <div className={`w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-white/5 text-xs text-purple-200`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-pink-300">
            <BookOpen size={15} weight="fill" />
            {wordsCount} palavras
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1 text-amber-300">
            <Clock size={15} />
            ~{readingTimeMinutes} min de leitura
          </span>
          {lastSaved && (
            <>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                <FloppyDisk size={13} />
                Rascunho salvo ({lastSaved})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Tipografia */}
          <select
            value={selectedFont.id}
            onChange={(e) => {
              const font = FONT_OPTIONS.find(f => f.id === e.target.value);
              if (font) setSelectedFont(font);
            }}
            className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-purple-200 outline-none focus:border-pink-500"
          >
            {FONT_OPTIONS.map(font => (
              <option key={font.id} value={font.id} className="bg-gray-900 text-white">
                {font.name}
              </option>
            ))}
          </select>

          {/* Botão Modo Foco / Wattpad */}
          <button
            type="button"
            onClick={() => setIsFocusMode(prev => !prev)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-medium transition-colors"
            title={isFocusMode ? "Sair do Modo Foco" : "Modo Foco / Wattpad"}
          >
            {isFocusMode ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
            <span className="hidden sm:inline">{isFocusMode ? 'Normal' : 'Modo Foco'}</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS ESTILO GOOGLE DOCS / BLOGGER */}
      <div className="w-full max-w-4xl flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-white/5">
        {/* Formatação básica */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Negrito"
        >
          <TextB size={16} weight="bold" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Itálico"
        >
          <TextItalic size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Tachado"
        >
          <TextStrikethrough size={16} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Títulos */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Título Grande"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Título Médio"
        >
          H2
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Alinhamento */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Alinhar à Esquerda"
        >
          <TextAlignLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Centralizar"
        >
          <TextAlignCenter size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Alinhar à Direita"
        >
          <TextAlignRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Justificar"
        >
          <TextAlignJustify size={16} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Listas & Citações */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Lista com Marcadores"
        >
          <ListBullets size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Lista Numerada"
        >
          <ListNumbers size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-pink-500 text-white' : 'text-purple-200 hover:bg-white/10'}`}
          title="Citação em Destaque"
        >
          <Quotes size={16} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Cores de Destaque / Marca-Texto Pastel */}
        <div className="flex items-center gap-1">
          {PASTEL_HIGHLIGHTS.map(h => (
            <button
              key={h.color}
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight({ color: h.color }).run()}
              className="w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125"
              style={{ backgroundColor: h.color }}
              title={`Marca-texto: ${h.label}`}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Inserir Foto Inline */}
        <button
          type="button"
          onClick={addInlineImage}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-purple-200 transition-colors"
          title="Inserir Foto no Meio do Texto"
        >
          <ImageIcon size={15} />
          <span className="hidden sm:inline">Foto Inline</span>
        </button>

        {/* Inserir Capítulo / Quebra */}
        <button
          type="button"
          onClick={insertChapterHeader}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-xs text-pink-300 border border-pink-500/20 transition-colors"
          title="Inserir Quebra de Capítulo"
        >
          <BookmarkSimple size={15} />
          <span className="hidden sm:inline">+ Capítulo</span>
        </button>
      </div>

      {/* ÁREA DE TEXTO DO EDITOR */}
      <div className={`w-full max-w-4xl p-4 sm:p-8 min-h-[260px] cursor-text ${selectedFont.className}`}>
        <EditorContent 
          editor={editor} 
          className="prose prose-invert prose-pink max-w-none focus:outline-none min-h-[220px] text-base leading-relaxed"
        />
      </div>
    </div>
  );
}
