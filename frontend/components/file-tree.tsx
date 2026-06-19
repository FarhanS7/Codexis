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
  modified: 'text-amber-400',
  added:    'text-emerald-400',
  deleted:  'text-red-400',
  renamed:  'text-blue-400',
  binary:   'text-neutral-400',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface FileTreeProps {
  files: ParsedFile[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Set of filePaths that have at least one AI suggestion — shows a dot indicator */
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
    <div className="h-full overflow-y-auto bg-[#0A0A0A] border-r border-white/5">
      {/* Panel header */}
      <div className="px-4 py-3.5 border-b border-white/5 sticky top-0 bg-[#0A0A0A] z-10">
        <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Changed Files
        </span>
        <span className="ml-2 text-[10px] text-neutral-700 font-bold">{files.length}</span>
      </div>

      {/* File list */}
      <div className="py-1.5">
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
              title={file.filePath}
              className={`
                w-full text-left px-4 py-2.5 flex items-center gap-3
                transition-all duration-200 text-xs
                ${isActive
                  ? 'bg-violet-500/10 text-white border-l-2 border-violet-500'
                  : 'text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300 border-l-2 border-transparent'
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

              {/* File name + directory */}
              <div className="flex-1 min-w-0">
                <div className={`truncate font-medium ${isActive ? 'text-white' : 'text-neutral-300'}`}>{fileName}</div>
                {dirPath && (
                  <div className="truncate text-neutral-600 text-[10px] mt-0.5">
                    {dirPath}
                  </div>
                )}
              </div>

              {/* AI suggestion indicator */}
              {hasSuggestions && (
                <span
                  className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse"
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
