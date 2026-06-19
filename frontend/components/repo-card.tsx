'use client';

import { formatDistanceToNow } from 'date-fns';
import type { Repo } from '@/types/github';

// Subset of GitHub's language color palette.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript:  'bg-blue-500',
  JavaScript:  'bg-yellow-400',
  Python:      'bg-blue-400',
  Go:          'bg-cyan-400',
  Rust:        'bg-orange-600',
  Java:        'bg-red-500',
  'C++':       'bg-pink-500',
  'C#':        'bg-purple-500',
  Ruby:        'bg-red-600',
  PHP:         'bg-indigo-400',
  Swift:       'bg-orange-500',
  Kotlin:      'bg-purple-400',
  Shell:       'bg-green-600',
  HTML:        'bg-orange-400',
  CSS:         'bg-blue-300',
  default:     'bg-neutral-500',
};

interface RepoCardProps {
  repo: Repo;
  isSelected: boolean;
  onSelect: (repo: { owner: string; name: string }) => void;
}

export function RepoCard({ repo, isSelected, onSelect }: RepoCardProps) {
  const langColor =
    LANGUAGE_COLORS[repo.language ?? ''] ?? LANGUAGE_COLORS.default;

  return (
    <button
      onClick={() => onSelect({ owner: repo.owner, name: repo.name })}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 group ${
        isSelected
          ? 'border-violet-500/50 bg-violet-500/[0.08] shadow-lg shadow-violet-500/5'
          : 'border-white/5 bg-neutral-900/30 hover:border-white/10 hover:bg-white/[0.03]'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm truncate group-hover:text-white/90">
              {repo.name}
            </span>
            {repo.isPrivate && (
              <span className="text-[10px] text-neutral-500 border border-white/10 rounded-full px-2 py-0.5 shrink-0 leading-none font-medium">
                Private
              </span>
            )}
          </div>

          {repo.description && (
            <p className="text-neutral-500 text-xs mt-1 line-clamp-2 leading-relaxed">
              {repo.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {repo.language && (
          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${langColor}`}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        )}
        <span className="text-xs text-neutral-600">
          {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
