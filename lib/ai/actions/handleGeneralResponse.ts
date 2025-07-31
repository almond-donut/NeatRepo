// lib/ai/actions/handleGeneralResponse.ts

import { AIResponse, UserContext } from '../types';

export const handleGeneralResponse = async (context: UserContext, params: any): Promise<AIResponse> => {
  const { repositories } = context;
  const { originalMessage, analyzeRepos, isCriticMode } = params;

  // If user wants analysis and we have repositories, provide personalized response
  if (analyzeRepos && repositories && repositories.length > 0) {
    const originalRepos = repositories.filter(repo => !repo.fork);
    const forkedCount = repositories.filter(repo => repo.fork).length;
    const totalRepos = repositories.length;
    const languages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))];
    const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const reposWithDescription = repositories.filter(repo => repo.description && repo.description.trim().length > 0).length;

    let analysisMessage = '';

    if (isCriticMode) {
      // Brutal critic mode
      analysisMessage = `**🔥 BRUTAL REPOSITORY REVIEW 🔥**\n\n`;
      
      if (totalStars === 0) {
        analysisMessage += `**OUCH!** Your repos have **0 stars total**. That's like a digital graveyard! 💀\n\n`;
      } else if (totalStars < 10) {
        analysisMessage += `**${totalStars} stars total?** That's... not great. Your repos are lonelier than a JavaScript developer at a Python conference.\n\n`;
      }

      if (originalRepos.length === 0) {
        analysisMessage += `**SERIOUSLY?** All ${totalRepos} repos are FORKS? Where's your originality? Copy-paste isn't a programming skill!\n\n`;
      } else if (originalRepos.length < 3) {
        analysisMessage += `Only **${originalRepos.length} original repos?** Come on, even my pet goldfish has more creativity!\n\n`;
      }

      if (reposWithDescription < totalRepos * 0.5) {
        analysisMessage += `**${totalRepos - reposWithDescription} repos without descriptions?** How are people supposed to know what your code does, telepathy?!\n\n`;
      }

      analysisMessage += `**YOUR REPOS:**\n`;
      repositories.slice(0, 8).forEach(repo => {
        analysisMessage += `• **${repo.name}** ${repo.language ? `(${repo.language})` : '(??)'} `;
        analysisMessage += `${repo.stargazers_count || 0}⭐ ${repo.fork ? '(FORK)' : ''}`;
        if (!repo.description) analysisMessage += ` 📝❌`;
        analysisMessage += `\n`;
      });

      analysisMessage += `\n**WHAT YOU NEED TO DO (NO EXCUSES):**\n`;
      analysisMessage += `1. **Create original projects** - Stop forking everything!\n`;
      analysisMessage += `2. **Write proper README files** - Explain what your code does!\n`;
      analysisMessage += `3. **Add descriptions** - One sentence isn't hard!\n`;
      analysisMessage += `4. **Pick better project names** - Make them meaningful!\n`;
      if (languages.length < 2) {
        analysisMessage += `5. **Learn more languages** - Diversity matters!\n`;
      }
      analysisMessage += `6. **Deploy your projects** - Show them working live!\n`;
      analysisMessage += `\n💀 **Bottom line:** Your portfolio needs SERIOUS work!`;

    } else {
      // Nice mode
      analysisMessage = `**✨ Repository Analysis ✨**\n\n`;
      analysisMessage += `Great to see your **${totalRepos} repositories**! Here's what I found:\n\n`;
      
      if (originalRepos.length > 0) {
        analysisMessage += `🎯 **${originalRepos.length} original projects** - Nice work creating your own content!\n`;
      }
      if (forkedCount > 0) {
        analysisMessage += `🍴 **${forkedCount} forked repositories** - Good way to learn from others!\n`;
      }
      if (totalStars > 0) {
        analysisMessage += `⭐ **${totalStars} total stars** - People are noticing your work!\n`;
      }
      if (languages.length > 0) {
        analysisMessage += `💻 **Languages:** ${languages.slice(0, 5).join(', ')}${languages.length > 5 ? '...' : ''}\n`;
      }

      analysisMessage += `\n**Your repositories:**\n`;
      repositories.slice(0, 8).forEach(repo => {
        analysisMessage += `• **${repo.name}** ${repo.language ? `(${repo.language})` : ''} `;
        if (repo.stargazers_count > 0) analysisMessage += `${repo.stargazers_count}⭐ `;
        analysisMessage += `${repo.fork ? '(forked)' : ''}\n`;
      });

      if (repositories.length > 8) {
        analysisMessage += `• ...and ${repositories.length - 8} more repositories\n`;
      }

      analysisMessage += `\n**💡 Suggestions to enhance your portfolio:**\n`;
      let suggestionCount = 1;
      
      if (reposWithDescription < totalRepos * 0.8) {
        analysisMessage += `${suggestionCount}. Add descriptions to more repositories for better discoverability\n`;
        suggestionCount++;
      }
      if (originalRepos.length < 5) {
        analysisMessage += `${suggestionCount}. Consider creating more original projects to demonstrate your skills\n`;
        suggestionCount++;
      }
      if (languages.length < 3) {
        analysisMessage += `${suggestionCount}. Explore different programming languages to show versatility\n`;
        suggestionCount++;
      }
      analysisMessage += `${suggestionCount}. Pin your best repositories to your GitHub profile\n`;
      suggestionCount++;
      analysisMessage += `${suggestionCount}. Consider adding live demos or deployment links\n`;
    }

    return {
      message: analysisMessage,
      success: true,
    };
  }

  // Default helpful message when no repositories or not asking for analysis
  const helpMessage = `**AI Assistant Ready**\n\nI'm your GitHub repository assistant! I can help you with:\n\n**Repository Management:**\n• "Create a new repo named [name]"\n• "Sort my repos by complexity"\n\n**Analysis & Optimization:**\n• "Analyze my repository structure"\n• "Give me suggestions to improve my repositories"\n• "Generate a portfolio README"\n\n**Example:** Try saying "what do you think about my repos?" or "analyze my repository structure"`

  return {
    message: helpMessage,
    success: true,
  };
};
