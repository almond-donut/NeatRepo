// lib/ai/actions/recommendCVRepos.ts

import { AIResponse, UserContext } from '../types';
import { RepositorySorter } from '../../github-api';

/**
 * Handles generating CV recommendations based on repository analysis.
 */
export async function handleRecommendCVRepos(
  context: UserContext,
  params: {}
): Promise<AIResponse> {
  const { repositories } = context;

  if (!repositories || repositories.length === 0) {
    return {
      message: "I need to know about your repositories first. Please connect your GitHub account and refresh.",
      success: false,
    };
  }

  try {
    // Note: This assumes repositories have been analyzed for complexity beforehand.
    const recommendations = RepositorySorter.generateCVRecommendations(repositories);
    
    let message = "Here are my recommendations for your CV based on your repositories:\n\n";

    recommendations.forEach(rec => {
      message += `**${rec.title}**\n`;
      message += `${rec.description}\n`;
      if (rec.repositories) {
        rec.repositories.forEach((repo: any) => {
          message += `- **${repo.name}**: ${repo.reason}\n`;
        });
      }
      message += '\n';
    });

    return {
      message,
      success: true,
      data: recommendations,
    };
  } catch (error: any) {
    console.error('Error generating CV recommendations:', error);
    return {
      message: `An unexpected error occurred while generating CV recommendations: ${error.message}`,
      success: false,
    };
  }
}
