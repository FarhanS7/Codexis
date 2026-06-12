type ReviewPageProps = {
  params: Promise<{
    owner: string;
    repo: string;
    pr: string;
  }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { owner, repo, pr } = await params;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Review Details</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2">
        {owner}/{repo} Pull Request #{pr} — Implement in Task 4.2
      </p>
    </div>
  );
}
