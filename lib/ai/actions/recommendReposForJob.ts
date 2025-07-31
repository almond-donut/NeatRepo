// lib/ai/actions/recommendReposForJob.ts

import { AIResponse, UserContext } from '../types';
import { geminiAI } from '@/lib/gemini';

export const recommendReposForJob = async (context: UserContext, params: { jobTitle: string }): Promise<AIResponse> => {
  const { jobTitle } = params;
  const { repositories } = context;

  if (!jobTitle) {
    return { message: "Please provide a job title so I can recommend the best repositories.", success: false };
  }
  if (!repositories || repositories.length === 0) {
    return { message: "I need your repositories to be loaded to make a recommendation.", success: false };
  }

  // Filter to only original repositories (not forks) for recommendation
  const originalRepos = repositories.filter(repo => !repo.fork);
  
  if (originalRepos.length === 0) {
    return { message: "You don't have any original repositories yet. Consider creating some projects relevant to the job position!", success: false };
  }

  const repoList = originalRepos.map(r => 
    `- ${r.name}: ${r.description || 'No description.'} (Language: ${r.language || 'Unknown'}, Stars: ${r.stargazers_count || 0})`
  ).join('\n');

  const prompt = `I am applying for a "${jobTitle}" position. From the following list of my GitHub repositories, select the TOP 4 most relevant repositories that would best showcase my skills for this role. 

Consider:
- Technical relevance to the job
- Programming languages used
- Project complexity and quality indicators (stars, description)
- Diversity of skills demonstrated

Return ONLY the repository names, separated by commas, no other text.

Repositories:
${repoList}`;

  try {
    const response = await geminiAI.generateResponse(prompt);
    const recommendedRepoNames = response.split(',').map(name => name.trim()).filter(name => name.length > 0);

    const recommendedRepos = originalRepos.filter(repo => 
      recommendedRepoNames.some(name => repo.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(repo.name.toLowerCase()))
    );

    // If AI didn't return good matches, fall back to selecting by stars and relevance
    if (recommendedRepos.length < 2) {
      const sortedRepos = originalRepos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
      recommendedRepos.push(...sortedRepos.slice(0, 4 - recommendedRepos.length));
    }

    // Ensure we have exactly 4 or fewer
    const finalRepos = recommendedRepos.slice(0, 4);

    if (finalRepos.length === 0) {
      return { 
        message: `I couldn't find any repositories that match the "${jobTitle}" role. Consider creating projects that demonstrate relevant skills!`, 
        success: true, 
        data: { recommendedRepos: [] } 
      };
    }

    let message = `### 🎯 Job Template for: **${jobTitle}**\n\nHere are the **${finalRepos.length} most relevant repositories** to showcase for this position:\n\n`;
    
    finalRepos.forEach((repo, index) => {
      message += `**${index + 1}. ${repo.name}**\n`;
      message += `   • Language: ${repo.language || 'Multiple'}\n`;
      message += `   • Stars: ${repo.stargazers_count || 0}\n`;
      message += `   • ${repo.description || 'No description available'}\n\n`;
    });
    
    message += `💡 **Pro tip**: Update the README files of these repositories to highlight features most relevant to ${jobTitle} roles!`;

    return {
      message,
      success: true,
      data: { recommendedRepos: finalRepos },
    };
  } catch (error) {
    console.error("Failed to get job recommendation:", error);
    return { 
      message: "I had trouble analyzing your repositories for that job title. Please try again later.", 
      success: false 
    };
  }
};