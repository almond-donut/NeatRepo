// lib/ai/actions/createFile.ts

import { AIResponse, UserContext } from '../types';
import { GitHubAPIService } from '../../github-api';

interface CreateFileParams {
  repoName: string;
  filePath: string;
  content: string;
  commitMessage?: string;
}

/**
 * Handles the creation of a new file in a GitHub repository.
 */
export async function handleCreateFile(
  context: UserContext,
  params: CreateFileParams
): Promise<AIResponse> {
  const { repoName, filePath, content, commitMessage } = params;
  const { githubAccessToken, githubUsername } = context;

  if (!repoName || !filePath || !content) {
    return {
      message: 'To create a file, I need a repository name, a file path, and the content.',
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
    const result = await githubAPI.createFile({
      owner: githubUsername,
      repo: repoName,
      path: filePath,
      content: content,
      message: commitMessage || `feat: create ${filePath}`,
    });

    if (result.success) {
      return {
        message: `Successfully created file! You can find it at: ${result.url}`,
        success: true,
        data: result.file,
      };
    } else {
      return {
        message: `Failed to create file: ${result.error}`,
        success: false,
      };
    }
  } catch (error: any) {
    console.error('Error creating file:', error);
    return {
      message: `An unexpected error occurred: ${error.message}`,
      success: false,
    };
  }
}
