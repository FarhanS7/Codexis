import { useEffect } from 'react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { Suggestion } from '@/types/review';

interface UseEditorPanelSyncProps {
  editorInstance: editor.IStandaloneDiffEditor | null;
  monaco: Monaco | null;
  suggestions: Suggestion[];
  activeFilePath: string;
  modifiedLineMap: Record<number, number> | undefined;
}

export function useEditorPanelSync({
  editorInstance,
  monaco,
  suggestions,
  activeFilePath,
  modifiedLineMap,
}: UseEditorPanelSyncProps): void {
  useEffect(() => {
    if (!editorInstance || !monaco || !modifiedLineMap) return;

    const modifiedEditor = editorInstance.getModifiedEditor();

    // Listen for mouse down events in Monaco editor
    const disposable = modifiedEditor.onMouseDown((event) => {
      const { type, position } = event.target;

      // Check if the click happened in the gutter glyph margin
      if (type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) return;
      if (!position) return;

      const clickedLineNumber = position.lineNumber;

      // Find the suggestion that corresponds to the clicked line number
      // We look up suggestion.line through the modifiedLineMap to match clickedLineNumber
      const activeSuggestions = suggestions.filter(
        (s) => s.file === activeFilePath && !s.dismissed && !s.accepted
      );

      const targetSuggestion = activeSuggestions.find((s) => {
        const mappedLine = modifiedLineMap[s.line];
        return mappedLine === clickedLineNumber;
      });

      if (!targetSuggestion) return;

      // Scroll the suggestions panel container to the target suggestion card
      const containerEl = document.getElementById('suggestions-panel-container');
      const cardEl = document.getElementById(`suggestion-card-${targetSuggestion.dedupeKey}`);

      if (containerEl && cardEl) {
        // Calculate offset position relative to the container scroll top
        const containerRect = containerEl.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const relativeOffsetTop = cardRect.top - containerRect.top + containerEl.scrollTop;

        containerEl.scrollTo({
          top: relativeOffsetTop - 24, // 24px padding/offset so the card isn't pressed against the top
          behavior: 'smooth',
        });

        // Add a temporary glow effect to the card for user feedback
        cardEl.classList.add('ring-2', 'ring-violet-500/50', 'bg-violet-500/10');
        setTimeout(() => {
          cardEl.classList.remove('ring-2', 'ring-violet-500/50', 'bg-violet-500/10');
        }, 1200);
      }
    });

    return () => {
      disposable.dispose();
    };
  }, [editorInstance, monaco, suggestions, activeFilePath, modifiedLineMap]);
}

/**
 * Scrolls the Monaco editor to show the specific suggestion line in center.
 */
export function scrollEditorToSuggestion(
  editorInstance: editor.IStandaloneDiffEditor,
  monaco: Monaco,
  suggestionLine: number,
  modifiedLineMap: Record<number, number> | undefined,
): void {
  if (!modifiedLineMap) return;
  const monacoLine = modifiedLineMap[suggestionLine];
  if (!monacoLine) return;

  const modifiedEditor = editorInstance.getModifiedEditor();
  
  // Smoothly scroll and center the line
  modifiedEditor.revealLineInCenter(monacoLine, monaco.editor.ScrollType.Smooth);
  modifiedEditor.setPosition({ lineNumber: monacoLine, column: 1 });
  modifiedEditor.focus();
}
