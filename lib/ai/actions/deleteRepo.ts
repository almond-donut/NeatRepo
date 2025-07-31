// lib/ai/actions/deleteRepo.ts

import { AIResponse, UserContext } from '../types';
import { GitHubAPIService } from '../../github-api';

/**
 * Handles the deletion of a GitHub repository.
 */
export async function handleDeleteRepo(
  context: UserContext,
  params: { name: string }
): Promise<AIResponse> {
  const { name } = params;
  const { githubAccessToken, githubUsername } = context;

  if (!name) {
    return {
      message: 'You need to provide the name of the repository to delete.',
      success: false,
    };
  }

  if (!githubAccessToken || !githubUsername) {
    return {
      message: 'GitHub credentials are not configured. Please connect your GitHub account.',
      success: false,
    };
  }

  try {
    const githubAPI = new GitHubAPIService(githubAccessToken, githubUsername);
    const result = await githubAPI.deleteRepository({ owner: githubUsername, name });

    if (result.success) {
      return {
        message: `Successfully deleted repository "${name}".`,
        success: true,
      };
    } else {
      return {
        message: `Failed to delete repository: ${result.error}`,
        success: false,
      };
    }
  } catch (error: any) {
    console.error('Error deleting repository:', error);
    return {
      message: `An unexpected error occurred: ${error.message}`,
      success: false,
    };
  }
}
