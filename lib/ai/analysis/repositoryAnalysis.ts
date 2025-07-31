// lib/ai/analysis/repositoryAnalysis.ts

import { Repository } from '@/lib/repository-sorter';
import { geminiAI } from '@/lib/gemini';
import { buildRepositoryAnalysisPrompt } from '../prompts/analysisPrompts';
import { UserProfile } from '../types';

/**
 * Analyzes a list of repositories for language stats and key highlights.
 */
export const analyzeRepositories = (repos: Repository[]) => {
  const languages: Record<string, number> = {};
  let totalStars = 0;
  let mostStarredRepo: Repository | null = null;
  let maxStars = -1;

  repos.forEach(repo => {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
    totalStars += repo.stargazers_count || 0;
    if ((repo.stargazers_count || 0) > maxStars) {
      maxStars = repo.stargazers_count || 0;
      mostStarredRepo = repo;
    }
  });

  const primaryLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([lang]) => lang);

  return {
    primaryLanguages,
    totalStars,
    mostStarredRepo,
    totalRepos: repos.length,
    languages
  };
};

/**
 * Gets the most recently updated projects from a list of repositories.
 */
export const getRecentProjects = (repos: Repository[], count: number = 3) => {
  return repos
    .filter(repo => !repo.private) // Exclude private repos for showcases
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, count);
};

/**
 * Analyzes the complexity of a repository.
 */
export async function analyzeRepositoryComplexity(repo: Repository, userProfile: UserProfile | null): Promise<{ complexity: string, reasoning: string }> {
  const prompt = buildRepositoryAnalysisPrompt(repo, userProfile);
  const response = await geminiAI.generateResponse(prompt);
  const text = response;

  // Simple parsing, assuming the model returns "Complexity: [level]\nReasoning: [text]"
  const complexityMatch = text.match(/Complexity:\s*(.*)/);
  const reasoningMatch = text.match(/Reasoning:\s*([\s\S]*)/);

  const complexity = complexityMatch ? complexityMatch[1].trim() : 'Could not determine';
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided.';

  return { complexity, reasoning };
}
