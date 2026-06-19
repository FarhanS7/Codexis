'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import type { PR } from '@/types/github';

interface PRCardProps {
  pr: PR;
  owner: string;
  repo: string;
}

export function PRCard({ pr, owner, repo }: PRCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/review/${owner}/${repo}/${pr.number}`);
  };

  const hasDiffStats = pr.additions > 0 || pr.deletions > 0;

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-4 rounded-xl border border-white/5 bg-neutral-900/30 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 group"
      aria-label={`Open pull request #${pr.number}: ${pr.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        <Image
          src={pr.author.avatarUrl}
          alt={`${pr.author.login}'s avatar`}
          width={32}
          height={32}
          className="rounded-full shrink-0 mt-0.5 ring-1 ring-white/10"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-neutral-600 shrink-0 font-mono font-semibold">
              #{pr.number}
            </span>
            <span className="font-medium text-white text-sm truncate leading-snug group-hover:text-white/90">
              {pr.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-xs text-neutral-600">by {pr.author.login}</span>
            <span className="text-neutral-700 select-none">·</span>
            <span className="text-xs text-neutral-600">
              opened{' '}
              {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
            </span>
          </div>

          {hasDiffStats && (
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-xs text-emerald-400/80 font-mono">
                +{pr.additions}
              </span>
              <span className="text-xs text-red-400/80 font-mono">
                -{pr.deletions}
              </span>
              <span className="text-xs text-neutral-600">
                {pr.changedFiles} file{pr.changedFiles !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <svg className="w-4 h-4 text-neutral-700 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  );
}
