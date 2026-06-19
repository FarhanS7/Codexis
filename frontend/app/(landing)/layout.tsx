import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Codexis — AI-Powered Code Review for GitHub PRs',
  description:
    'Codexis streams intelligent code review suggestions directly into your GitHub pull requests. Catch bugs, enforce patterns, and ship with confidence.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
