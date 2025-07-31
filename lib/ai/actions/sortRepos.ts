// lib/ai/actions/sortRepos.ts

import { AIResponse, UserContext } from '../types';
import { RepositorySorter } from '../../github-api';
import { GitHubRepo } from '@/app/dashboard/types';

/**
 * Handles sorting the user's repositories based on specified criteria.
 */
export async function handleSortRepos(
  context: UserContext,
  params: { criteria: 'complexity' | 'date'; order: 'asc' | 'desc' }
): Promise<AIResponse> {
  const { criteria, order } = params;
  const { repositories } = context;

  if (!repositories || repositories.length === 0) {
    return {
      message: "I don't have any repositories to sort. Please connect your GitHub account and refresh.",
      success: false,
    };
  }

  let sortedRepos: GitHubRepo[] = [];
  let sortDescription = '';

  try {
    if (criteria === 'complexity') {
      // The RepositorySorter expects repositories to have a 'complexity' object.
      // This is a placeholder for now, as complexity analysis is its own action.
      // In a real scenario, we'd fetch this data first if it's not already available.
      sortedRepos = RepositorySorter.sortByComplexity(repositories, order);
      sortDescription = `by complexity (${order === 'asc' ? 'Simple → Advanced' : 'Advanced → Simple'})`;
    } else {
      // Default to sorting by date (updated_at)
      sortedRepos = [...repositories].sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
      sortDescription = `by last update date (${order === 'asc' ? 'Oldest → Newest' : 'Newest → Oldest'})`;
    }

    const repoList = sortedRepos.map(repo => `- **${repo.name}**`).join('\n');

    return {
      message: `I have sorted your repositories ${sortDescription}:\n\n${repoList}`,
      success: true,
      data: sortedRepos,
    };
  } catch (error: any) {
    console.error('Error sorting repositories:', error);
    return {
      message: `An unexpected error occurred while sorting: ${error.message}`,
      success: false,
    };
  }
}
