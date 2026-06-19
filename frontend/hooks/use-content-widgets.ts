import { useEffect, useRef } from 'react';
import type { editor } from 'monaco-editor';
import { InlineCommentWidget } from '@/components/editor/InlineCommentWidget';
import type { Suggestion } from '@/types/review';

export function useContentWidgets(
  editorInstance: editor.IStandaloneDiffEditor | null,
  suggestions: Suggestion[],
  activeFilePath: string,
  modifiedLineMap: Record<number, number> | undefined,
  onAccept: (dedupeKey: string) => void,
  onDismiss: (dedupeKey: string) => void,
): void {
  // Map of suggestion dedupeKey -> InlineCommentWidget instance
  const widgetsRef = useRef<Map<string, InlineCommentWidget>>(new Map());

  useEffect(() => {
    if (!editorInstance || !modifiedLineMap) return;

    const modifiedEditor = editorInstance.getModifiedEditor();
    const existingWidgets = widgetsRef.current;

    // Filter suggestions that belong to the active file
    const activeSuggestions = suggestions.filter((s) => s.file === activeFilePath);

    // 1. Remove widgets for suggestions that have been accepted, dismissed, or are no longer in suggestions list
    for (const [key, widget] of Array.from(existingWidgets.entries())) {
      const suggestion = activeSuggestions.find((s) => s.dedupeKey === key);
      
      // If suggestion is no longer active, has been accepted, or is dismissed, remove its widget
      if (!suggestion || suggestion.accepted || suggestion.dismissed) {
        try {
          modifiedEditor.removeContentWidget(widget);
          widget.dispose();
        } catch (e) {
          console.warn('Failed to remove content widget:', e);
        }
        existingWidgets.delete(key);
      }
    }

    // 2. Add widgets for suggestions that do not have one yet
    for (const suggestion of activeSuggestions) {
      // Don't show widgets for accepted or dismissed suggestions
      if (suggestion.accepted || suggestion.dismissed) continue;
      
      // Skip if widget already exists
      if (existingWidgets.has(suggestion.dedupeKey)) continue;

      // Look up Monaco model line number using modifiedLineMap
      const monacoLine = modifiedLineMap[suggestion.line];
      if (!monacoLine) continue; // Skip if line doesn't exist in map

      // Create new widget
      const widget = new InlineCommentWidget({
        id: suggestion.dedupeKey,
        lineNumber: monacoLine,
        suggestion,
        onAccept: () => onAccept(suggestion.dedupeKey),
        onDismiss: () => onDismiss(suggestion.dedupeKey),
      });

      try {
        modifiedEditor.addContentWidget(widget);
        existingWidgets.set(suggestion.dedupeKey, widget);
      } catch (e) {
        console.error('Failed to add content widget to Monaco:', e);
      }
    }
  }, [editorInstance, suggestions, activeFilePath, modifiedLineMap, onAccept, onDismiss]);

  // Clean up all widgets when active file changes or when the component unmounts
  useEffect(() => {
    return () => {
      if (editorInstance) {
        try {
          const modifiedEditor = editorInstance.getModifiedEditor();
          widgetsRef.current.forEach((widget) => {
            modifiedEditor.removeContentWidget(widget);
            widget.dispose();
          });
          widgetsRef.current.clear();
        } catch (e) {
          console.warn('Failed to clean up content widgets:', e);
        }
      }
    };
  }, [editorInstance, activeFilePath]);
}
