'use client';

import type { ParsedFile, DiffChangeType } from '@/types/github';

// ─── Icon + Color Maps ────────────────────────────────────────────────────────

const CHANGE_TYPE_ICONS: Record<DiffChangeType, string> = {
  modified: '✏️',
  added:    '➕',
  deleted:  '🗑️',
  renamed:  '📋',
  binary:   '⬛',
};

const CHANGE_TYPE_COLORS: Record<DiffChangeType, string> = {
  modified: 'text-yellow-400',
  added:    'text-green-400',
  deleted:  'text-red-400',
  renamed:  'text-blue-400',
  binary:   'text-gray-400',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface FileTreeProps {
  files: ParsedFile[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Set of filePaths that have at least one AI suggestion — shows a yellow dot indicator */
  filesWithSuggestions?: Set<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileTree({
  files,
  activeIndex,
  onSelect,
  filesWithSuggestions = new Set(),
}: FileTreeProps) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 border-r border-zinc-800">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Changed Files
        </span>
        <span className="ml-2 text-xs text-zinc-600 font-bold">{files.length}</span>
      </div>

      {/* File list */}
      <div className="py-2">
        {files.map((file, index) => {
          const isActive       = index === activeIndex;
          const hasSuggestions = filesWithSuggestions.has(file.filePath);

          // Split path into filename + directory for the two-line display
          const segments = file.filePath.split('/');
          const fileName = segments.pop() ?? file.filePath;
          const dirPath  = segments.join('/');

          return (
            <button
              key={file.filePath}
              onClick={() => onSelect(index)}
              title={file.filePath}  // Native tooltip for truncated paths
              className={`
                w-full text-left px-4 py-2.5 flex items-center gap-3
                transition-colors duration-150 text-xs
                ${isActive
                  ? 'bg-blue-600/20 text-white border-l-2 border-blue-500'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border-l-2 border-transparent'
                }
              `}
            >
              {/* Change type icon */}
              <span
                className={`shrink-0 leading-none text-sm ${CHANGE_TYPE_COLORS[file.changeType]}`}
                aria-label={file.changeType}
              >
                {CHANGE_TYPE_ICONS[file.changeType]}
              </span>

              {/* File name + directory — two-line layout */}
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-zinc-200">{fileName}</div>
                {dirPath && (
                  <div className="truncate text-zinc-500 text-[10px] mt-0.5">
                    {dirPath}
                  </div>
                )}
              </div>

              {/* Yellow dot indicator: this file has AI suggestions */}
              {hasSuggestions && (
                <span
                  className="w-2 h-2 rounded-full bg-yellow-400 shrink-0 animate-pulse"
                  title="Has AI suggestions"
                  aria-label="Has AI suggestions"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
