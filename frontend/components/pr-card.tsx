'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import type { PR } from '@/types/github';

interface PRCardProps {
  pr: PR;
  owner: string; // Repo owner — needed to build the review URL
  repo: string;  // Repo name — needed to build the review URL
}

export function PRCard({ pr, owner, repo }: PRCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to the review page. router.push() is a client-side navigation —
    // no full page reload, no loss of React state in the parent Dashboard.
    router.push(`/review/${owner}/${repo}/${pr.number}`);
  };

  const hasDiffStats = pr.additions > 0 || pr.deletions > 0;

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      aria-label={`Open pull request #${pr.number}: ${pr.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Author avatar — uses Next.js Image for optimization */}
        <Image
          src={pr.author.avatarUrl}
          alt={`${pr.author.login}'s avatar`}
          width={32}
          height={32}
          className="rounded-full shrink-0 mt-0.5 ring-1 ring-gray-700"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 shrink-0 font-mono">
              #{pr.number}
            </span>
            <span className="font-medium text-white text-sm truncate leading-snug">
              {pr.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs text-gray-500">by {pr.author.login}</span>
            <span className="text-gray-700 select-none">·</span>
            <span className="text-xs text-gray-500">
              opened{' '}
              {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
            </span>
          </div>

          {hasDiffStats && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-green-500 font-mono">
                +{pr.additions}
              </span>
              <span className="text-xs text-red-500 font-mono">
                -{pr.deletions}
              </span>
              <span className="text-xs text-gray-500">
                {pr.changedFiles} file{pr.changedFiles !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
