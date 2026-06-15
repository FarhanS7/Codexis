'use client';

import { formatDistanceToNow } from 'date-fns';
import type { Repo } from '@/types/github';

// Subset of GitHub's language color palette mapped to Tailwind bg classes.
// Add languages as needed; the 'default' key is the fallback.
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
  default:     'bg-gray-500',
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
      className={`w-full text-left p-4 rounded-lg border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm truncate">
              {repo.name}
            </span>
            {repo.isPrivate && (
              <span className="text-xs text-gray-400 border border-gray-700 rounded px-1.5 py-0.5 shrink-0 leading-none">
                Private
              </span>
            )}
          </div>

          {repo.description && (
            <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
              {repo.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {repo.language && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${langColor}`}
              aria-hidden="true"
            />
            {repo.language}
          </span>
        )}
        <span className="text-xs text-gray-500">
          Updated{' '}
          {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </button>
  );
}
