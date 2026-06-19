import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import type { ClientSuggestion, PostStatus, UseAcceptDismissReturn } from '@/types/review';

export function useAcceptDismiss(
  suggestions: ClientSuggestion[],
  setSuggestions: React.Dispatch<React.SetStateAction<ClientSuggestion[]>>,
  reviewId: string | null,
  owner: string,
  repo: string,
  prNumber: string | number,
): UseAcceptDismissReturn {
  const { showToast } = useToast();
  const [postStatus, setPostStatus] = useState<PostStatus>('idle');
  const [postErrorMessage, setPostErrorMessage] = useState<string | null>(null);

  // ─── Accept ───
  const handleAccept = useCallback(async (dedupeKey: string) => {
    const target = suggestions.find((s) => s.dedupeKey === dedupeKey);
    if (!target || !target.id) return; // Skip if suggestion has no database ID (still streaming)

    // Store original state for rollback
    const originalState = { accepted: target.accepted, dismissed: target.dismissed };

    // Step 1: Optimistic UI Update
    setSuggestions((prev) =>
      prev.map((s) =>
        s.dedupeKey === dedupeKey
          ? { ...s, accepted: true, dismissed: false, pending: true }
          : s
      )
    );

    try {
      // Step 2: Confirm with Server
      await api.patch(`/review/comments/${target.id}/accept`);

      // Step 3: Remove pending flag
      setSuggestions((prev) =>
        prev.map((s) =>
          s.dedupeKey === dedupeKey ? { ...s, pending: false } : s
        )
      );
    } catch (err: any) {
      console.error('Failed to accept comment:', err);
      // Step 4: Rollback on Failure
      setSuggestions((prev) =>
        prev.map((s) =>
          s.dedupeKey === dedupeKey
            ? { ...s, accepted: originalState.accepted, dismissed: originalState.dismissed, pending: false }
            : s
        )
      );
      showToast('error', 'Failed to accept suggestion. Please try again.');
    }
  }, [suggestions, setSuggestions, showToast]);

  // ─── Dismiss ───
  const handleDismiss = useCallback(async (dedupeKey: string) => {
    const target = suggestions.find((s) => s.dedupeKey === dedupeKey);
    if (!target || !target.id) return;

    // Store original state for rollback
    const originalState = { accepted: target.accepted, dismissed: target.dismissed };

    // Step 1: Optimistic UI Update
    setSuggestions((prev) =>
      prev.map((s) =>
        s.dedupeKey === dedupeKey
          ? { ...s, dismissed: true, accepted: false, pending: true }
          : s
      )
    );

    try {
      // Step 2: Confirm with Server
      await api.patch(`/review/comments/${target.id}/dismiss`);

      // Step 3: Remove pending flag
      setSuggestions((prev) =>
        prev.map((s) =>
          s.dedupeKey === dedupeKey ? { ...s, pending: false } : s
        )
      );
    } catch (err: any) {
      console.error('Failed to dismiss comment:', err);
      // Step 4: Rollback on Failure
      setSuggestions((prev) =>
        prev.map((s) =>
          s.dedupeKey === dedupeKey
            ? { ...s, accepted: originalState.accepted, dismissed: originalState.dismissed, pending: false }
            : s
        )
      );
      showToast('error', 'Failed to dismiss suggestion. Please try again.');
    }
  }, [suggestions, setSuggestions, showToast]);

  // ─── Post to GitHub ───
  const handlePostToGitHub = useCallback(async () => {
    if (!reviewId) {
      showToast('error', 'No active review session found to post.');
      return;
    }

    setPostStatus('posting');
    setPostErrorMessage(null);

    const acceptedUnposted = suggestions.filter((s) => s.accepted && !s.posted);
    if (acceptedUnposted.length === 0) {
      showToast('info', 'There are no accepted, unposted comments to publish.');
      setPostStatus('idle');
      return;
    }

    try {
      const response = await api.post<{ posted: number; githubReviewId?: number }>(
        `/review/${reviewId}/post-to-github`,
        {
          owner,
          repo,
          prNumber: Number(prNumber),
        }
      );

      // Mark all accepted suggestions as posted
      setSuggestions((prev) =>
        prev.map((s) =>
          s.accepted ? { ...s, posted: true } : s
        )
      );

      setPostStatus('posted');
      showToast(
        'success',
        `✓ Successfully posted ${response.data.posted} review comment${
          response.data.posted !== 1 ? 's' : ''
        } to GitHub!`
      );
    } catch (err: any) {
      console.error('Failed to post review to GitHub:', err);
      setPostStatus('error');
      
      const message =
        err.response?.status === 403
          ? 'Insufficient GitHub OAuth permissions to write PR reviews.'
          : err.response?.data?.message ?? 'Failed to post suggestions to GitHub.';
          
      setPostErrorMessage(message);
      showToast('error', message);
    }
  }, [reviewId, suggestions, owner, repo, prNumber, setSuggestions, showToast]);

  return {
    handleAccept,
    handleDismiss,
    handlePostToGitHub,
    postStatus,
    postErrorMessage,
  };
}
