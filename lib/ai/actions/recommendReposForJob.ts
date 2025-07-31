// lib/ai/actions/recommendReposForJob.ts
import { AIResponse, UserContext } from '../types';
import { geminiAI } from '@/lib/gemini';
import { GitHubRepo } from '@/app/dashboard/types';

export const recommendReposForJob = async (context: UserContext, params: { jobTitle: string }): Promise<AIResponse> => {
    const { jobTitle } = params;
    const { repositories } = context;

    if (!jobTitle) {
        return { message: "Please provide a job title so I can recommend the best repositories.", success: false };
    }
    if (!repositories || repositories.length === 0) {
        return { message: "I need your repositories to be loaded to make a recommendation.", success: false };
    }

    const originalRepos = repositories.filter(repo => !repo.fork);

    if (originalRepos.length === 0) {
        return { message: "You don't have any original repositories. I can't make a recommendation without them.", success: true, data: { recommendedRepos: [] } };
    }

    const repoList = originalRepos.map(r =>
        `- Name: ${r.name}, Description: ${r.description || 'N/A'}, Language: ${r.language || 'N/A'}, Stars: ${r.stargazers_count}`
    ).join('\n');

    // More robust prompt asking for a specific format (JSON)
    const prompt = `
        Analyze the following list of GitHub repositories and select the top 4 most relevant projects for a person applying to a "${jobTitle}" position.

        Consider technical relevance (frameworks, languages), project complexity, and overall appeal to a recruiter for this specific role.

        Repositories:
        ${repoList}

        Respond ONLY with a JSON array of strings containing the exact names of the 4 recommended repositories. For example: ["repo-one", "project-x", "another-repo", "final-choice"]. Do not include any other text, explanation, or markdown formatting.
    `;

    try {
        const rawResponse = await geminiAI.generateResponse(prompt);
        let recommendedRepoNames: string[] = [];

        // More robust parsing logic to find and parse the JSON array
        try {
            const jsonMatch = rawResponse.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                recommendedRepoNames = JSON.parse(jsonMatch[0]);
            } else {
                console.warn("AI response was not valid JSON, falling back to comma-separated parsing.");
                recommendedRepoNames = rawResponse.split(',').map(name => name.trim().replace(/["']/g, ''));
            }
        } catch (parseError) {
            console.error("Failed to parse AI response, falling back to simple split:", parseError);
            recommendedRepoNames = rawResponse.split(',').map(name => name.trim().replace(/["']/g, ''));
        }
        
        // Filter the original repo list to find the full objects using a precise match
        const recommendedRepos = recommendedRepoNames
            .map(name => originalRepos.find(repo => repo.name.toLowerCase() === name.toLowerCase()))
            .filter((repo): repo is GitHubRepo => repo !== undefined); // Type guard to filter out any undefined matches

        const finalRepos = recommendedRepos.slice(0, 4);
        
        if (finalRepos.length === 0) {
            return {
                message: `I couldn't confidently select relevant repositories for a "${jobTitle}" role. Here are your top repositories by stars instead:`,
                success: true,
                data: { 
                    recommendedRepos: originalRepos
                        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
                        .slice(0, 4)
                }
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
    } catch (error: any) {
        console.error("Error in recommendReposForJob calling Gemini:", error);
        return {
            message: "I had trouble analyzing your repositories for that job title. Please check if the AI integration is configured correctly and try again.",
            success: false,
        };
    }
};