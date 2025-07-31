// lib/ai/actions/createRepo.ts

import { AIResponse, UserContext } from '../types';
import { GitHubAPIService } from '../../github-api';

/**
 * Handles the creation of a new GitHub repository.
 * 
 * @param context The user's context, including their profile and repositories.
 * @param params The parameters for the action, expecting a 'name' for the repository.
 * @returns An AIResponse indicating the result of the operation.
 */
export async function handleCreateRepo(
  context: UserContext,
  params: { name: string }
): Promise<AIResponse> {
  const { name } = params;
  const { githubAccessToken, githubUsername } = context;

  if (!name) {
    return {
      message: 'You need to provide a name for the new repository.',
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
    const result = await githubAPI.createRepository({ name });

    if (result.success) {
      return {
        message: `Successfully created repository! You can find it at: ${result.url}`,
        success: true,
        data: result.repository,
      };
    } else {
      return {
        message: `Failed to create repository: ${result.error}`,
        success: false,
      };
    }
  } catch (error: any) {
    console.error('Error creating repository:', error);
    return {
      message: `An unexpected error occurred: ${error.message}`,
      success: false,
    };
  }
}
