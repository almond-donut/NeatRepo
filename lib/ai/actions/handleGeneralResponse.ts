// lib/ai/actions/handleGeneralResponse.ts
import { AIResponse, UserContext } from '../types';
import { geminiAI } from '@/lib/gemini';

export const handleGeneralResponse = async (context: UserContext, params: any): Promise<AIResponse> => {
    const { repositories } = context;
    const { analyzeRepos, isCriticMode } = params;

    // Guard clause: if not analyzing or no repos, return a helpful message.
    if (!analyzeRepos || !repositories || repositories.length === 0) {
        const helpMessage = `I can help with various repository tasks. For example, you can ask me to "analyze my repositories," "generate a portfolio README," or "recommend projects for a frontend developer job." What would you like to do?`;
        return { message: helpMessage, success: true };
    }

    try {
        const repoSummaries = repositories
            .filter(repo => !repo.fork) // Focus on original work
            .slice(0, 20) // Limit to a reasonable number to avoid huge prompts
            .map(r => `- ${r.name}: ${r.description || 'No description.'} (Lang: ${r.language || 'N/A'}, Stars: ${r.stargazers_count})`)
            .join('\n');

        const criticPrompt = isCriticMode
            ? "Your tone should be brutally honest, direct, and witty, like a senior engineer who has seen it all. Don't hold back on constructive criticism. Point out weaknesses bluntly."
            : "Your tone should be encouraging, professional, and helpful, like a friendly mentor. Focus on positive aspects and frame suggestions constructively.";

        const prompt = `
            As a senior engineering manager reviewing a developer's GitHub portfolio, provide a high-level analysis of the following repositories.
            ${criticPrompt}

            Based on this list of repositories:
            ${repoSummaries}

            Please provide:
            1.  **Overall Impression:** A brief, one-paragraph summary of the portfolio's strengths and weaknesses.
            2.  **Key Strengths:** 2-3 bullet points highlighting what this portfolio does well (e.g., language diversity, project complexity, clear focus).
            3.  **Top Areas for Improvement:** 2-3 actionable bullet points on what to improve next (e.g., add project descriptions, create more complex projects, add live demos).

            Keep the entire response concise and easy to read in a chat window.
        `;

        const analysisMessage = await geminiAI.generateResponse(prompt);

        return {
            message: analysisMessage,
            success: true,
        };
    } catch (error: any) {
        console.error("Error in handleGeneralResponse calling Gemini:", error);
        return {
            message: "I had some trouble analyzing your repositories right now. Please check if the AI integration is configured correctly and try again.",
            success: false,
        };
    }
};
