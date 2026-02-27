/**
 * Rich Text Editor Component
 * Simple WYSIWYG editor with Bold, Italic, Underline
 */

import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  minHeight = '200px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Handle input
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Execute command
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Check if command is active
  const isActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  // Toolbar button component
  const ToolbarButton: React.FC<{
    command: string;
    icon: React.ReactNode;
    title: string;
  }> = ({ command, icon, title }) => (
    <button
      type="button"
      onClick={() => execCommand(command)}
      title={title}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        isActive(command) ? 'bg-gray-200 text-primary-600' : 'text-gray-600'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <ToolbarButton
          command="bold"
          title="Bold (Ctrl+B)"
          icon={<span className="font-bold w-5 h-5 flex items-center justify-center">B</span>}
        />
        <ToolbarButton
          command="italic"
          title="Italic (Ctrl+I)"
          icon={<span className="italic w-5 h-5 flex items-center justify-center">I</span>}
        />
        <ToolbarButton
          command="underline"
          title="Underline (Ctrl+U)"
          icon={<span className="underline w-5 h-5 flex items-center justify-center">U</span>}
        />
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          command="strikeThrough"
          title="Strikethrough"
          icon={<span className="line-through w-5 h-5 flex items-center justify-center">S</span>}
        />
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          command="insertUnorderedList"
          title="Bullet List"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          }
        />
        <ToolbarButton
          command="insertOrderedList"
          title="Numbered List"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          }
        />
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<h2>')}
          title="Heading"
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
        >
          <span className="font-bold text-sm">H</span>
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('formatBlock', '<p>')}
          title="Paragraph"
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
        >
          <span className="text-sm">¶</span>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }}
          title="Insert Link"
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          title="Clear Formatting"
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600 ml-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="p-4 focus:outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        suppressContentEditableWarning
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
