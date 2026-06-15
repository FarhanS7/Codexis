'use client';

import { DiffEditor, type Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MonacoDiffEditorWrapperProps {
  original: string;    // Full text of the original (base) file
  modified: string;    // Full text of the modified (PR head) file
  language: string;    // Monaco language identifier — use getMonacoLanguage(filePath)
  /** Called once when Monaco mounts. Use to capture editorRef in the parent. */
  onEditorMount?: (editor: editor.IStandaloneDiffEditor, monaco: Monaco) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MonacoDiffEditorWrapper({
  original,
  modified,
  language,
  onEditorMount,
}: MonacoDiffEditorWrapperProps) {
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme="vs-dark"
      height="100%"
      width="100%"
      options={{
        readOnly: true,               // Code review — users read, not edit
        renderSideBySide: true,       // Side-by-side diff (GitHub-style)
        fontSize: 13,                 // Matches VS Code default
        lineHeight: 20,               // Comfortable reading line height
        minimap: { enabled: false },  // Minimap consumes ~15% horizontal space for little value
        scrollBeyondLastLine: false,  // No empty space below the last line
        wordWrap: 'off',              // Horizontal scroll — preserves column structure in diffs
        diffWordWrap: 'off',          // Consistent with wordWrap setting
        ignoreTrimWhitespace: false,  // Show trailing whitespace diffs — meaningful in YAML, Python
        originalEditable: false,      // Left (original) panel is also read-only
        lineNumbers: 'on',            // Line numbers help navigate AI suggestions
        glyphMargin: true,            // Required for Task 6.1 glyph decorations
        folding: false,               // Folding in a diff view adds complexity without benefit
        automaticLayout: true,        // Automatically resize editor on parent container changes
      }}
      loading={
        // Custom loading overlay shown while Monaco's ~5MB JS bundle downloads.
        // Replaces Monaco's default blank white screen with a dark spinner
        // that matches the rest of the UI.
        <div className="h-full w-full flex items-center justify-center bg-zinc-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading editor...</p>
          </div>
        </div>
      }
      onMount={(mountedEditor, monaco) => {
        // Forward the editor instance to the parent via the optional callback.
        // ReviewPage stores it in editorRef.current for Task 6.1 decorations.
        onEditorMount?.(mountedEditor, monaco);
      }}
    />
  );
}
