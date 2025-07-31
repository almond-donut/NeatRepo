import { AIAction, AIResponse, UserContext, ConversationEntry } from './ai/types';

// Action Handlers
import { handleAnalyzeComplexity } from './ai/actions/analyzeComplexity';
import { handleGeneralResponse } from './ai/actions/handleGeneralResponse';
import { recommendReposForJob } from './ai/actions/recommendReposForJob';
import { handleCreateRepo } from './ai/actions/createRepo';
import { handleCreateFile } from './ai/actions/createFile';
import { handleDeleteRepo } from './ai/actions/deleteRepo';
import { handleSortRepos } from './ai/actions/sortRepos';
import { handleRecommendCVRepos } from './ai/actions/recommendCVRepos';
import { handleStartInterview } from './ai/actions/startInterview';
import { handleInterviewAnswer } from './ai/actions/handleInterviewAnswer';

// A map of action names to their handler functions
const actionHandlers: {
  [key: string]: (context: UserContext, params: any) => Promise<AIResponse>;
} = {
  create_repo: handleCreateRepo,
  create_file: handleCreateFile,
  delete_repo: handleDeleteRepo,
  sort_repos: handleSortRepos,
  recommend_cv_repos: handleRecommendCVRepos,
  start_interview: handleStartInterview,
  handle_interview_answer: handleInterviewAnswer,
  analyze_complexity: handleAnalyzeComplexity,
  recommend_repos_for_job: recommendReposForJob,
  general_response: handleGeneralResponse,
};

/**
 * A simple intent parser based on keywords.
 * This is a placeholder and can be replaced with a more sophisticated NLU/NLP service.
 * @param message The user's message.
 * @returns An AIAction object representing the detected intent.
 */
function parseIntent(message: string, context: UserContext): AIAction {
  const lowerMessage = message.toLowerCase();

  // If an interview is active, treat any message as an answer.
  if (context.interviewState?.isActive) {
    return {
      type: 'handle_interview_answer',
      intent: 'User is answering an interview question.',
      parameters: { answer: message },
      confidence: 1.0, // Highest confidence because it's a stateful override
    };
  }

  if (lowerMessage.includes('create') && lowerMessage.includes('file')) {
    const fileMatch = message.match(/create a file named ['"]?([^'"\s]+)['"]?/i);
    const repoMatch = message.match(/in (?:repo|repository) ['"]?([^'"\s]+)['"]?/i);
    const contentMatch = message.match(/with content ['"](.*)['"]/i);

    const filePath = fileMatch ? fileMatch[1] : '';
    const repoName = repoMatch ? repoMatch[1] : '';
    const content = contentMatch ? contentMatch[1] : `// ${filePath} created by NeatRepo AI`;

    return {
      type: 'create_file',
      intent: 'User wants to create a new file in a repository.',
      parameters: { repoName, filePath, content },
      confidence: 0.9,
    };
  }

  if (lowerMessage.includes('start') && lowerMessage.includes('interview')) {
    return {
      type: 'start_interview',
      intent: 'User wants to start the portfolio interview.',
      parameters: {},
      confidence: 0.95,
    };
  }

  if ((lowerMessage.includes('cv') || lowerMessage.includes('resume')) && lowerMessage.includes('recommend')) {
    return {
      type: 'recommend_cv_repos',
      intent: 'User wants CV recommendations for their repositories.',
      parameters: {},
      confidence: 0.9,
    };
  }

  if (lowerMessage.includes('sort') && lowerMessage.includes('repos')) {
    let criteria: 'complexity' | 'date' = 'date';
    let order: 'asc' | 'desc' = 'desc';

    if (lowerMessage.includes('complexity')) {
      criteria = 'complexity';
    }

    if (lowerMessage.includes('asc') || lowerMessage.includes('simple to complex') || lowerMessage.includes('oldest')) {
      order = 'asc';
    }

    return {
      type: 'sort_repos',
      intent: 'User wants to sort repositories.',
      parameters: { criteria, order },
      confidence: 0.9,
    };
  }

  if (lowerMessage.includes('delete') && lowerMessage.includes('repo')) {
    const nameMatch = message.match(/(?:delete|remove) (?:repo|repository) ['"]?([^'"\s]+)['"]?/i);
    const repoName = nameMatch ? nameMatch[1] : '';
    return {
      type: 'delete_repo',
      intent: 'User wants to delete a repository.',
      parameters: { name: repoName },
      confidence: 0.9,
    };
  }

  if (lowerMessage.includes('create') && lowerMessage.includes('repo')) {
    const nameMatch = message.match(/(?:named?|called)\s+['"]?([^'"\s]+)['"]?/i);
    const repoName = nameMatch ? nameMatch[1] : '';
    return {
      type: 'create_repo',
      intent: 'User wants to create a new repository.',
      parameters: { name: repoName },
      confidence: 0.9,
    };
  }

  if (lowerMessage.includes('analyze') && lowerMessage.includes('complexity')) {
    // Extract repo name if available, e.g., "analyze complexity of my-repo"
    const repoNameMatch = lowerMessage.match(/of (.*?)$/);
    const repoName = repoNameMatch ? repoNameMatch[1].trim() : '';
    return {
      type: 'analyze_complexity',
      intent: 'User wants to analyze repository complexity.',
      parameters: { repoName }, // Pass repoName to handler
      confidence: 0.8,
    };
  }

  if (lowerMessage.includes('recommend') && (lowerMessage.includes('job') || lowerMessage.includes('position'))) {
    const jobTitleMatch = lowerMessage.match(/for (?:a |an )?(.*?)(?:\s+position|$)/);
    const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : 'developer';
    return {
      type: 'recommend_repos_for_job',
      intent: 'User wants repository recommendations for a job application.',
      parameters: { jobTitle },
      confidence: 0.8,
    };
  }

  if (lowerMessage.includes('generate') && lowerMessage.includes('personal') && lowerMessage.includes('readme')) {
    return {
      type: 'start_interview',
      intent: 'User wants to generate a personal README through interview.',
      parameters: {},
      confidence: 0.95,
    };
  }

  if (lowerMessage.includes('generate') && lowerMessage.includes('portfolio') && lowerMessage.includes('readme')) {
    return {
      type: 'start_interview',
      intent: 'User wants to generate a portfolio README through interview.',
      parameters: {},
      confidence: 0.9,
    };
  }

  if (lowerMessage.includes('analyze') || lowerMessage.includes('structure') || lowerMessage.includes('suggestions') || lowerMessage.includes('improve') || lowerMessage.includes('think') || lowerMessage.includes('opinion')) {
    return {
      type: 'general_response',
      intent: 'User wants analysis or suggestions about their repositories.',
      parameters: { 
        originalMessage: message, 
        analyzeRepos: true,
        isCriticMode: context.preferences?.isCriticMode || false
      },
      confidence: 0.7,
    };
  }

  return {
    type: 'general_response',
    intent: 'General query or fallback.',
    parameters: { originalMessage: message },
    confidence: 0.5,
  };
}

export class AIAssistant {
  private static instance: AIAssistant;
  private userContext: UserContext;
  private conversationHistory: ConversationEntry[] = [];

  private constructor() {
    this.userContext = {
      repositories: [],
      githubUsername: undefined,
      githubAccessToken: undefined,
      conversationHistory: [],
      interviewState: undefined,
      preferences: {},
      userProfile: null,
    };
  }

  public static getInstance(): AIAssistant {
    if (!AIAssistant.instance) {
      AIAssistant.instance = new AIAssistant();
    }
    return AIAssistant.instance;
  }

  public updateUserContext(updates: Partial<UserContext>) {
    this.userContext = { ...this.userContext, ...updates };
  }

  public getContext(): UserContext {
    return this.userContext;
  }

  private addToConversationHistory(entry: ConversationEntry) {
    this.userContext.conversationHistory.push(entry);
  }

  public async processMessage(message: string): Promise<AIResponse> {
    this.addToConversationHistory({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    const detectedAction = parseIntent(message, this.userContext);
    const handler = actionHandlers[detectedAction.type];

    if (!handler) {
      const errorResponse: AIResponse = {
        message: `Error: Action "${detectedAction.type}" is not supported.`,
        success: false,
      };
      this.addToConversationHistory({ role: 'assistant', content: errorResponse.message, timestamp: new Date() });
      return errorResponse;
    }

    try {
      const response = await handler(this.userContext, detectedAction.parameters);

      // Check if the action returned a state update for the interview
      if (response.data?.interviewState) {
        this.userContext.interviewState = response.data.interviewState;
      }

      this.addToConversationHistory({
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      });

      return response;
    } catch (error: any) {
      console.error(`Error processing action "${detectedAction.type}":`, error);
      const errorResponse: AIResponse = {
        message: `Sorry, an error occurred: ${error.message}`,
        success: false,
      };
      this.addToConversationHistory({ role: 'assistant', content: errorResponse.message, timestamp: new Date() });
      return errorResponse;
    }
  }
}

// Singleton instance of the AI assistant, initialized with empty context.
export const aiAssistant = AIAssistant.getInstance();
