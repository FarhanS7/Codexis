import { useEffect, useRef } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { Suggestion } from '@/types/review';

const SEVERITY_DECORATION: Record<string, { className: string; glyphMarginClassName: string }> = {
  bug: { className: 'decoration-bug-line', glyphMarginClassName: 'decoration-bug-gutter' },
  security: { className: 'decoration-security-line', glyphMarginClassName: 'decoration-security-gutter' },
  performance: { className: 'decoration-performance-line', glyphMarginClassName: 'decoration-perf-gutter' },
  style: { className: 'decoration-style-line', glyphMarginClassName: 'decoration-style-gutter' },
};

export function useMonacoDecorations(
  editorInstance: editor.IStandaloneDiffEditor | null,
  monaco: Monaco | null,
  suggestions: Suggestion[],
  activeFilePath: string,
  modifiedLineMap: Record<number, number> | undefined,
): void {
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editorInstance || !monaco || !modifiedLineMap) return;

    const modifiedEditor = editorInstance.getModifiedEditor();
    
    // Filter suggestions for active file that are not dismissed or accepted
    const activeSuggestions = suggestions.filter(
      (s) => s.file === activeFilePath && !s.dismissed && !s.accepted
    );

    // Build decorations delta
    const newDecorations: editor.IModelDeltaDecoration[] = activeSuggestions
      .flatMap((s) => {
        // Look up the Monaco model line number using the modifiedLineMap
        const monacoLine = modifiedLineMap[s.line];
        if (!monacoLine) return []; // Line is not in the map (e.g., belongs to a deleted block), skip

        const config = SEVERITY_DECORATION[s.severity] ?? SEVERITY_DECORATION.style;

        const overviewColor = s.severity === 'bug' ? '#ef4444' 
                            : s.severity === 'security' ? '#f97316' 
                            : s.severity === 'performance' ? '#eab308' 
                            : '#3b82f6';

        return [
          {
            range: new monaco.Range(monacoLine, 1, monacoLine, 1),
            options: {
              isWholeLine: true,
              className: config.className,
              glyphMarginClassName: config.glyphMarginClassName,
              glyphMarginHoverMessage: { value: `**${s.severity.toUpperCase()}**: ${s.body}` },
              overviewRuler: {
                color: overviewColor,
                position: monaco.editor.OverviewRulerLane.Right,
              },
            },
          },
        ];
      });

    // Apply delta decorations to the modified editor
    decorationIdsRef.current = modifiedEditor.deltaDecorations(
      decorationIdsRef.current,
      newDecorations
    );
  }, [editorInstance, monaco, suggestions, activeFilePath, modifiedLineMap]);

  // Clean up decorations on unmount or active file change
  useEffect(() => {
    return () => {
      if (editorInstance && decorationIdsRef.current.length > 0) {
        try {
          const modifiedEditor = editorInstance.getModifiedEditor();
          modifiedEditor.deltaDecorations(decorationIdsRef.current, []);
          decorationIdsRef.current = [];
        } catch (e) {
          // Monaco editor might have been disposed already
          console.warn('Failed to clean up decorations:', e);
        }
      }
    };
  }, [editorInstance, activeFilePath]);
}
