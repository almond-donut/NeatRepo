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

  const repoList = repositories.map(r => `- ${r.name}: ${r.description || 'No description.'} (Language: ${r.language})`).join('\n');
  const prompt = `I am applying for a \"${jobTitle}\" position. From the following list of my GitHub repositories, which are the TOP 3 most relevant ones to showcase? List only the names of the 3 repositories, separated by commas. Do not add any other text or explanation.\n\nRepositories:\n${repoList}`;

  try {
    const response = await geminiAI.generateResponse(prompt);
    const recommendedRepoNames = response.split(',').map(name => name.trim());

    const recommendedRepos = repositories.filter(repo => recommendedRepoNames.includes(repo.name));

    if (recommendedRepos.length === 0) {
        return { message: `I couldn't find any repositories that seemed like a strong match for a \"${jobTitle}\" role. You may want to create a new project tailored to this field.`, success: true, data: { recommendedRepos: [] } };
    }

    let message = `### 🎯 Job Template for: ${jobTitle}\n\nBased on your repositories, here are the top ${recommendedRepos.length} projects I recommend showcasing:\n\n`;
    recommendedRepos.forEach(repo => {
      message += `- **${repo.name}**: A strong choice because of its use of **${repo.language}** and its relevant features.\n`;
    });
    message += `\nRemember to tailor your resume to highlight the skills you demonstrated in these specific projects!`;

    return {
      message,
      success: true,
      data: { recommendedRepos },
    };
  } catch (error) {
    console.error("Failed to get job recommendation:", error);
    return { message: "I had trouble analyzing your repos for that job title. Please try again.", success: false };
  }
};
