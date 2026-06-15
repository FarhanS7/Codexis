'use client';

import { useState } from 'react';
import { useRepos } from '@/hooks/use-repos';
import { usePullRequests } from '@/hooks/use-pull-requests';
import { RepoCard } from '@/components/repo-card';
import { PRCard } from '@/components/pr-card';
import { RepoSkeleton, PRSkeleton } from '@/components/skeletons';

interface SelectedRepo {
  owner: string;
  name: string;
}

export default function DashboardPage() {
  const [selectedRepo, setSelectedRepo] = useState<SelectedRepo | null>(null);

  const { repos, loading: reposLoading, error: reposError } = useRepos();
  const {
    prs,
    loading: prsLoading,
    error: prsError,
  } = usePullRequests(
    selectedRepo?.owner ?? null,
    selectedRepo?.name ?? null,
  );

  return (
    // 57px = NavBar height. Both columns fill the remaining viewport height.
    <div className="flex h-[calc(100vh-57px)] bg-gray-950">

      {/* ═══════════════════════════════════════════════════
          LEFT COLUMN — Repo list
      ═══════════════════════════════════════════════════ */}
      <div className="w-80 shrink-0 border-r border-gray-800 flex flex-col">

        {/* Column header */}
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-gray-300">Repositories</h2>
          {!reposLoading && !reposError && (
            <p className="text-xs text-gray-500 mt-0.5">
              {repos.length} {repos.length === 1 ? 'repo' : 'repos'}
            </p>
          )}
        </div>

        {/* Scrollable repo list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">

          {/* Loading state */}
          {reposLoading && <RepoSkeleton count={6} />}

          {/* Error state */}
          {reposError && (
            <div className="text-center py-8 px-4">
              <p className="text-red-400 text-sm">{reposError}</p>
              <p className="text-gray-600 text-xs mt-2">
                Check that the backend is running and you are logged in.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!reposLoading && !reposError && repos.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-gray-400 text-sm font-medium">
                No repositories found
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Make sure your GitHub account has repositories.
              </p>
            </div>
          )}

          {/* Populated state */}
          {!reposLoading &&
            !reposError &&
            repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                isSelected={
                  selectedRepo?.owner === repo.owner &&
                  selectedRepo?.name === repo.name
                }
                onSelect={setSelectedRepo}
              />
            ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RIGHT COLUMN — PR list
      ═══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Column header */}
        <div className="px-6 py-3 border-b border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-gray-300">
            {selectedRepo
              ? `${selectedRepo.owner}/${selectedRepo.name} — Open PRs`
              : 'Select a repository'}
          </h2>
          {selectedRepo && !prsLoading && !prsError && (
            <p className="text-xs text-gray-500 mt-0.5">
              {prs.length} open pull request{prs.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Scrollable PR list */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── No repo selected: landing/idle state ── */}
          {!selectedRepo && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-medium">
                Select a repository
              </p>
              <p className="text-gray-600 text-xs mt-1 max-w-xs">
                Choose a repo from the left panel to see its open pull requests
              </p>
            </div>
          )}

          {/* ── Loading PRs ── */}
          {selectedRepo && prsLoading && <PRSkeleton count={4} />}

          {/* ── Error loading PRs ── */}
          {selectedRepo && prsError && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{prsError}</p>
              <p className="text-gray-600 text-xs mt-2">
                Could not load pull requests for{' '}
                {selectedRepo.owner}/{selectedRepo.name}.
              </p>
            </div>
          )}

          {/* ── No open PRs empty state ── */}
          {selectedRepo && !prsLoading && !prsError && prs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-400 text-sm font-medium">
                No open pull requests
              </p>
              <p className="text-gray-600 text-xs mt-1">
                {selectedRepo.owner}/{selectedRepo.name} has no open PRs right now
              </p>
            </div>
          )}

          {/* ── Populated PR list ── */}
          {selectedRepo && !prsLoading && !prsError && prs.length > 0 && (
            <div className="space-y-3">
              {prs.map((pr) => (
                <PRCard
                  key={pr.id}
                  pr={pr}
                  owner={selectedRepo.owner}
                  repo={selectedRepo.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
