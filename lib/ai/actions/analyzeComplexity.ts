import { AIResponse, UserContext } from '../types';
import { analyzeRepositoryComplexity } from '../analysis/repositoryAnalysis';

export const handleAnalyzeComplexity = async (
  context: UserContext,
  params: { repoName: string }
): Promise<AIResponse> => {
  const repo = context.repositories.find(r => r.name === params.repoName);

  if (!repo) {
    const errorMessage = `Error: Repository "${params.repoName}" not found.`;
    console.error(errorMessage);
    return { message: errorMessage, success: false };
  }

  try {
    const { complexity, reasoning } = await analyzeRepositoryComplexity(
      repo,
      context.userProfile ?? null
    );

    const responseMessage = `The complexity of the repository **${params.repoName}** is **${complexity}**.\n\n*Reasoning:*\n${reasoning}`;

    return { message: responseMessage, success: true };
  } catch (error: any) {
    console.error(`Error analyzing complexity for repo "${params.repoName}":`, error);
    return {
      message: `Sorry, an error occurred while analyzing the repository: ${error.message}`,
      success: false,
    };
  }
};

