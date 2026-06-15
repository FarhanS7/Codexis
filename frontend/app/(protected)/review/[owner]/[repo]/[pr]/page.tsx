'use client';

import { useRef, useState, useEffect, use } from 'react';
import type { editor } from 'monaco-editor';
import type { Monaco } from '@monaco-editor/react';
import { useParsedDiff } from '@/hooks/use-parsed-diff';
import { FileTree } from '@/components/file-tree';
import { MonacoDiffEditorWrapper } from '@/components/monaco-diff-editor-wrapper';
import { getMonacoLanguage } from '@/lib/language-map';
import { EditorErrorBoundary } from '@/components/editor/EditorErrorBoundary';

// ─── Route Params ─────────────────────────────────────────────────────────────

type ReviewPageParams = {
  params: Promise<{ owner: string; repo: string; pr: string }>;
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ReviewPage({ params }: ReviewPageParams) {
  // Unwrap the async params Promise — Next.js 15 dynamic params are async
  const { owner, repo, pr } = use(params);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { parsedDiff, loading, error } = useParsedDiff(owner, repo, pr);

  // ── UI State ──────────────────────────────────────────────────────────────
  // Index into parsedDiff.files — drives which file's diff is shown in Monaco
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Reset to first file when a new diff loads (navigating between PRs)
  useEffect(() => {
    if (parsedDiff) {
      setActiveFileIndex(0);
    }
  }, [parsedDiff]);

  // ── Editor Ref ────────────────────────────────────────────────────────────
  // Stores the IStandaloneDiffEditor instance after Monaco mounts.
  // Used by Task 6.1 decoration hooks: editorRef.current.getModifiedEditor().deltaDecorations(...)
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  const handleEditorMount = (
    mountedEditor: editor.IStandaloneDiffEditor,
    _monaco: Monaco,
  ) => {
    editorRef.current = mountedEditor;
  };

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">Fetching diff...</p>
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center bg-zinc-950">
        <div className="text-center max-w-md px-6">
          <p className="text-red-400 font-medium text-sm">{error}</p>
          <p className="text-zinc-500 text-xs mt-2">
            Check that the PR number is correct and you have read access to this repository.
          </p>
        </div>
      </div>
    );
  }

  // ── Empty State ───────────────────────────────────────────────────────────

  if (!parsedDiff || parsedDiff.files.length === 0) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-500 text-sm">No changes found in this pull request.</p>
          <p className="text-zinc-650 text-xs mt-1">
            The PR may have no file changes, or all changes may be in binary files.
          </p>
        </div>
      </div>
    );
  }

  // ── Derive active file content ────────────────────────────────────────────

  // Bounds-check: if activeFileIndex is out of range (e.g., parsedDiff updated
  // with fewer files), clamp to the last valid index.
  const safeIndex  = Math.min(activeFileIndex, parsedDiff.files.length - 1);
  const activeFile = parsedDiff.files[safeIndex];

  // Join line arrays into full-file strings for Monaco.
  // .join('\n') creates a new string reference on every file switch,
  // which signals to React (and Monaco) that the prop has changed.
  const original = activeFile.originalLines.join('\n');
  const modified = activeFile.modifiedLines.join('\n');
  const language = getMonacoLanguage(activeFile.filePath);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-zinc-950">

      {/* PR header bar ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-zinc-800 bg-zinc-900 flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-white">
          {owner}/{repo}
        </span>
        <span className="text-zinc-700">·</span>
        <span className="text-sm text-zinc-400">PR #{pr}</span>
        <span className="text-zinc-700">·</span>
        <span className="text-xs text-zinc-500 font-semibold bg-zinc-800 px-2.5 py-1 rounded-full">
          {parsedDiff.files.length} file{parsedDiff.files.length !== 1 ? 's' : ''} changed
        </span>
        {/* SHA badges for context */}
        {parsedDiff.baseSha && (
          <>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500 font-mono bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800">
              base: {parsedDiff.baseSha.slice(0, 7)}
            </span>
            <span className="text-zinc-500 font-bold">→</span>
            <span className="text-xs text-zinc-500 font-mono bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800">
              head: {parsedDiff.headSha.slice(0, 7)}
            </span>
          </>
        )}
      </div>

      {/* Three-panel layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left panel: File tree ─────────────────────────────────────── */}
        <div className="w-60 shrink-0 overflow-y-auto">
          <FileTree
            files={parsedDiff.files}
            activeIndex={safeIndex}
            onSelect={setActiveFileIndex}
          />
        </div>

        {/* Center panel: Monaco diff editor ─────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <EditorErrorBoundary>
            <MonacoDiffEditorWrapper
              original={original}
              modified={modified}
              language={language}
              onEditorMount={handleEditorMount}
            />
          </EditorErrorBoundary>
        </div>

        {/* Right panel: AI suggestions (placeholder — Task 5.2) ──────── */}
        <div className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/40">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              AI Suggestions
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6 space-y-2">
              <p className="text-zinc-500 text-sm font-medium">Suggestions panel</p>
              <p className="text-zinc-600 text-xs mt-1">
                Implement in Task 5.2
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
