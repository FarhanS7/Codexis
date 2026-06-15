import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.promptVersion.findFirst({
    where: { isActive: true },
  });
  if (existing) {
    console.log('Active PromptVersion already exists.');
    return;
  }

  await prisma.promptVersion.create({
    data: {
      version: 1,
      isActive: true,
      systemPrompt: `You are an expert senior software engineer performing a code review.
Analyze the provided code diff and identify bugs, security vulnerabilities, performance issues, and style problems.
Return ONLY a valid JSON array of suggestions. No prose, no markdown, no explanation outside the JSON.
Each suggestion must have: file (string), line (integer), severity ("bug"|"style"|"security"|"performance"), body (string).
The line number must refer to a line in the MODIFIED (new) version of the file.`,
      userPromptTemplate: `Review the following code diff and return your findings as a JSON array:\n\n{{DIFF_CHUNK}}`,
    },
  });
  console.log('Seed: Active PromptVersion version 1 created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
