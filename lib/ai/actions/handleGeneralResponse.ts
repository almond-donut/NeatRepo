// lib/ai/actions/handleGeneralResponse.ts

import { AIResponse, UserContext } from '../types';

export const handleGeneralResponse = async (context: UserContext, params: any): Promise<AIResponse> => {
  const { repositories } = context;
  const { originalMessage, analyzeRepos } = params;

  // If user wants analysis and we have repositories, provide personalized response
  if (analyzeRepos && repositories && repositories.length > 0) {
    const repoNames = repositories.map(repo => repo.name).join(', ');
    const totalRepos = repositories.length;
    const languages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))];
    const forkedCount = repositories.filter(repo => repo.fork).length;
    const originalCount = totalRepos - forkedCount;

    let analysisMessage = `**Repository Analysis**\n\n`;
    analysisMessage += `I can see you have **${totalRepos} repositories** (${originalCount} original, ${forkedCount} forked).\n\n`;
    
    if (languages.length > 0) {
      analysisMessage += `**Languages:** ${languages.slice(0, 5).join(', ')}${languages.length > 5 ? '...' : ''}\n\n`;
    }

    analysisMessage += `**Your repositories:**\n`;
    repositories.slice(0, 10).forEach(repo => {
      analysisMessage += `• **${repo.name}** ${repo.language ? `(${repo.language})` : ''} ${repo.fork ? '(forked)' : ''}\n`;
    });

    if (repositories.length > 10) {
      analysisMessage += `• ...and ${repositories.length - 10} more\n`;
    }

    analysisMessage += `\n**Suggestions:**\n`;
    
    if (originalCount === 0) {
      analysisMessage += `• Consider creating some original repositories to showcase your skills\n`;
    }
    
    if (languages.length > 3) {
      analysisMessage += `• You have diverse language experience - great for showing versatility!\n`;
    }
    
    analysisMessage += `• Use "Generate Portfolio README" to create a professional overview\n`;
    analysisMessage += `• Try "Sort my repos by complexity" to organize your work\n`;

    return {
      message: analysisMessage,
      success: true,
    };
  }

  // Default helpful message when no repositories or not asking for analysis
  const helpMessage = `**AI Assistant Ready**\n\nI'm your GitHub repository assistant! I can help you with:\n\n**Repository Management:**\n• "Create a new repo named [name]"\n• "Sort my repos by complexity"\n\n**Analysis & Optimization:**\n• "Analyze my repository structure"\n• "Give me suggestions to improve my repositories"\n• "Generate a portfolio README"\n\n**Example:** Try saying "analyze my repository structure" or "give me suggestions"`

  return {
    message: helpMessage,
    success: true,
  };
};
