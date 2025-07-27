// AI Assistant Engine - TRUE AI ASSISTANT with Real Actions
import { geminiAI } from './gemini';
import { GitHubAPIService } from './github-api';
import { RepositorySorter, Repository } from './repository-sorter';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'personal' | 'technical' | 'career' | 'projects' | 'hobbies';
  followUp?: string;
}

export interface InterviewState {
  isActive: boolean;
  currentQuestion: number;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  completed: boolean;
}

export interface PortfolioData {
  name?: string;
  codingPassion?: string;
  recentExcitement?: string;
  careerGoals?: string;
  hobbies?: string;
  techFocus?: string;
  personalStory?: string;
}

export interface AIAction {
  type: 'create_repo' | 'create_file' | 'delete_repo' | 'sort_repos' | 'analyze_complexity' | 'cv_recommendations' | 'generate_portfolio_readme' | 'start_interview' | 'interview_answer' | 'general_response';
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface AIResponse {
  message: string;
  action?: AIAction;
  data?: any;
  success: boolean;
}

export interface UserContext {
  repositories: any[];
  preferences: {
    targetJob?: string;
    techStack?: string[];
    experienceLevel?: string;
  };
  personalInfo?: {
    name?: string;
    bio?: string;
    hobbies?: string[];
    careerGoals?: string;
    favoriteLanguages?: string[];
    personalStory?: string;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export class AIAssistantEngine {
  private githubAPI: GitHubAPIService | null = null;
  private userContext: UserContext;
  private interviewState: InterviewState;

  constructor() {
    this.userContext = {
      repositories: [],
      preferences: {},
      conversationHistory: [],
    };

    // 💾 RESTORE INTERVIEW STATE FROM LOCALSTORAGE
    this.interviewState = this.loadInterviewState();
  }

  // 💾 SAVE INTERVIEW STATE TO LOCALSTORAGE
  private saveInterviewState() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('ai_interview_state', JSON.stringify(this.interviewState));
      console.log('💾 Interview state saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save interview state:', error);
    }
  }

  // 💾 LOAD INTERVIEW STATE FROM LOCALSTORAGE
  private loadInterviewState(): InterviewState {
    if (typeof window === 'undefined') {
      console.log('💾 Server-side rendering, using default interview state');
      return {
        isActive: false,
        currentQuestion: 0,
        questions: [],
        answers: {},
        completed: false,
      };
    }

    try {
      const saved = localStorage.getItem('ai_interview_state');
      console.log('💾 Raw localStorage value:', saved);

      if (saved) {
        const state = JSON.parse(saved);
        console.log('💾 Interview state loaded from localStorage:', state);
        return state;
      } else {
        console.log('💾 No saved interview state found in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to load interview state:', error);
    }

    console.log('💾 Using default interview state');
    return {
      isActive: false,
      currentQuestion: 0,
      questions: [],
      answers: {},
      completed: false,
    };
  }

  // 💾 CLEAR INTERVIEW STATE
  private clearInterviewState() {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('ai_interview_state');
      console.log('💾 Interview state cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear interview state:', error);
    }
  }

  // 🔧 Initialize with GitHub credentials
  initializeGitHub(accessToken: string, username: string) {
    this.githubAPI = new GitHubAPIService(accessToken, username);
    console.log('🔧 GitHub API initialized for:', username);
  }

  // 🎤 INTERVIEW QUESTION BANK
  private getInterviewQuestions(): InterviewQuestion[] {
    return [
      {
        id: 'name_passion',
        question: "Hi! I'm excited to help you create an amazing portfolio README! 🚀 Let's start with the basics - what's your name and what do you love most about coding?",
        category: 'personal',
        followUp: "That's awesome! Tell me more about what specifically excites you about that."
      },
      {
        id: 'recent_excitement',
        question: "What project or technology have you been most excited about recently? I'd love to hear what's been keeping you motivated!",
        category: 'projects',
        followUp: "That sounds fascinating! What was the most challenging or rewarding part?"
      },
      {
        id: 'career_goals',
        question: "Where do you see yourself in your coding journey? Any dream job, company, or role you're working towards?",
        category: 'career',
        followUp: "That's a great goal! What steps are you taking to get there?"
      },
      {
        id: 'tech_focus',
        question: "What technologies or programming languages are you most passionate about right now? What draws you to them?",
        category: 'technical',
        followUp: "Interesting choice! What do you love most about working with those?"
      },
      {
        id: 'hobbies_personality',
        question: "When you're not coding, what do you love to do? I want to show your personality in your README!",
        category: 'hobbies',
        followUp: "That's cool! How do those interests influence your approach to coding?"
      },
      {
        id: 'personal_story',
        question: "Last question! Is there anything unique about your coding journey or background that you'd like people to know about you?",
        category: 'personal',
        followUp: "That's a great story! It really shows your unique perspective."
      }
    ];
  }

  // 🧠 PARSE USER COMMAND USING AI
  async parseCommand(userMessage: string): Promise<AIAction> {
    // 🔍 DEBUG: Log interview state
    console.log('🔍 DEBUG Interview State:', {
      isActive: this.interviewState.isActive,
      completed: this.interviewState.completed,
      currentQuestion: this.interviewState.currentQuestion,
      totalQuestions: this.interviewState.questions.length
    });

    // 🎤 INTERVIEW MODE: If interview is active, treat all responses as interview answers
    if (this.interviewState.isActive && !this.interviewState.completed) {
      console.log('🎤 Interview active - treating response as interview answer');
      return {
        type: 'interview_answer',
        intent: 'User answering interview question',
        parameters: {
          answer: userMessage,
          questionId: this.interviewState.questions[this.interviewState.currentQuestion]?.id
        },
        confidence: 1.0
      };
    }

    const systemPrompt = `You are an AI assistant that helps developers manage their GitHub repositories.

    Analyze the user's message and determine what action they want to perform. Respond with a JSON object containing:

    {
      "type": "create_repo" | "create_file" | "delete_repo" | "sort_repos" | "analyze_complexity" | "cv_recommendations" | "generate_portfolio_readme" | "start_interview" | "interview_answer" | "general_response",
      "intent": "brief description of what user wants",
      "parameters": {
        // extracted parameters based on action type
      },
      "confidence": 0.0-1.0
    }
    
    Action Types:
    - create_repo: User wants to create a new repository
      Parameters: { name, description?, private?, gitignore?, license? }
    - create_file: User wants to create a file in a repository
      Parameters: { repo, filename, content?, message? }
    - delete_repo: User wants to delete a repository (DANGEROUS!)
      Parameters: { name, confirm?: boolean }
    - sort_repos: User wants to sort/organize repositories
      Parameters: { criteria: "complexity" | "date" | "cv" | "alphabetical", order?: "asc" | "desc" }
    - analyze_complexity: User wants complexity analysis
      Parameters: { repo?, all?: boolean }
    - cv_recommendations: User wants CV/resume optimization
      Parameters: { targetJob?, focus? }
    - generate_portfolio_readme: User wants a comprehensive portfolio README
      Parameters: { includePersonal?: boolean }
    - start_interview: User wants to start portfolio interview for personalized README
      Parameters: { mode?: "quick" | "detailed" }
    - interview_answer: User is answering an interview question
      Parameters: { answer: string, questionId?: string }
    - general_response: General conversation or help
      Parameters: { topic? }
    
    Examples:
    "Create a new repo named Hello world" → create_repo with name="Hello world"
    "Delete the hello-world-test repository" → delete_repo with name="hello-world-test"
    "Sort repos from simple to complex" → sort_repos with criteria="complexity", order="asc"
    "Sort my repositories from simple to complex for CV readiness" → sort_repos with criteria="complexity", order="asc"
    "Please sort the repos in order from simple to complex so i can put it on my CV" → sort_repos with criteria="complexity", order="asc"
    "Recommend repositories for my CV" → cv_recommendations
    "Create a file readme in my hello-world repo" → create_file with repo="hello-world", filename="README.md"
    "Generate portfolio README" → generate_portfolio_readme
    "Create README based on all my repos" → generate_portfolio_readme
    "Start interview for portfolio" → start_interview
    "I want personalized README" → start_interview

    PRIORITY RULES:
    - If user mentions "sort" AND ("simple" OR "complex" OR "complexity"), ALWAYS use sort_repos regardless of CV mention
    - Only use cv_recommendations for general CV advice without specific sorting requests
    
    IMPORTANT: Only respond with valid JSON, no additional text.`;

    try {
      const response = await geminiAI.generateResponse(
        userMessage,
        this.userContext.conversationHistory.slice(-5), // Last 5 messages for context
        systemPrompt
      );

      // Parse AI response as JSON
      const cleanResponse = response.trim().replace(/```json\n?|\n?```/g, '');
      const action: AIAction = JSON.parse(cleanResponse);
      
      console.log('🧠 AI parsed command:', action);
      return action;
    } catch (error) {
      console.error('❌ Failed to parse command:', error);
      // Fallback to simple pattern matching
      return this.fallbackParsing(userMessage);
    }
  }

  // 🎯 EXECUTE AI ACTION
  async executeAction(action: AIAction): Promise<AIResponse> {
    console.log(`🎯 Executing action: ${action.type}`);

    try {
      switch (action.type) {
        case 'create_repo':
          return await this.handleCreateRepository(action.parameters);

        case 'create_file':
          return await this.handleCreateFile(action.parameters);

        case 'delete_repo':
          return await this.handleDeleteRepository(action.parameters);
        
        case 'sort_repos':
          return await this.handleSortRepositories(action.parameters);
        
        case 'analyze_complexity':
          return await this.handleAnalyzeComplexity(action.parameters);
        
        case 'cv_recommendations':
          return await this.handleCVRecommendations(action.parameters);

        case 'generate_portfolio_readme':
          return await this.handleGeneratePortfolioReadme(action.parameters);

        case 'start_interview':
          return await this.handleStartInterview(action.parameters);

        case 'interview_answer':
          return await this.handleInterviewAnswer(action.parameters);

        case 'general_response':
          return await this.handleGeneralResponse(action.parameters);
        
        default:
          return {
            message: "I'm not sure how to help with that. Can you try rephrasing your request?",
            success: false,
          };
      }
    } catch (error: any) {
      console.error('❌ Action execution failed:', error);
      return {
        message: `Sorry, I encountered an error: ${error.message}`,
        success: false,
      };
    }
  }

  // 🚀 CREATE REPOSITORY ACTION
  private async handleCreateRepository(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    const { name, description, private: isPrivate, gitignore, license } = params;
    
    if (!name) {
      return {
        message: "I need a repository name to create it. What would you like to name your repository?",
        success: false,
      };
    }

    const result = await this.githubAPI.createRepository({
      name: name.replace(/\s+/g, '-').toLowerCase(), // Convert to kebab-case
      description: description || `Repository created by AI Assistant`,
      private: isPrivate || false,
      auto_init: true,
      gitignore_template: gitignore,
      license_template: license,
    });

    if (result.success) {
      return {
        message: `🚀 Successfully created repository "${name}"!\n\n✅ Repository URL: ${result.url}\n\n⏱️ **Please note:** It may take 10-15 seconds for the repository to appear in your dashboard due to GitHub API sync delays. This is normal!\n\nYour new repository is ready to use. Would you like me to create any files in it?`,
        action: {
          type: 'create_repo',
          intent: 'Repository created successfully',
          parameters: { name, url: result.url },
          confidence: 1.0,
        },
        data: result.repository,
        success: true,
      };
    } else {
      return {
        message: `❌ Failed to create repository "${name}": ${result.error}\n\nThis might be because:\n• A repository with this name already exists\n• Invalid repository name\n• GitHub API limits\n\nTry a different name or check your GitHub account.`,
        success: false,
      };
    }
  }

  // 📄 CREATE FILE ACTION
  private async handleCreateFile(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    const { repo, filename, content, message } = params;
    
    if (!repo || !filename) {
      return {
        message: "I need both a repository name and filename. For example: 'Create a README.md file in my hello-world repo'",
        success: false,
      };
    }

    // Generate default content based on file type
    let fileContent = content;
    if (!fileContent) {
      if (filename.toLowerCase().includes('readme')) {
        fileContent = `# ${repo}\n\nDescription of your project.\n\n## Installation\n\n\`\`\`bash\n# Add installation instructions\n\`\`\`\n\n## Usage\n\n\`\`\`bash\n# Add usage examples\n\`\`\`\n\n## Contributing\n\nContributions are welcome!\n`;
      } else {
        fileContent = `// ${filename}\n// Created by AI Assistant\n\nconsole.log('Hello, World!');\n`;
      }
    }

    // Get the actual username from GitHub API
    const username = this.githubAPI ? await this.getAuthenticatedUsername() : 'user';
    
    const result = await this.githubAPI.createFile({
      owner: username,
      repo: repo,
      path: filename,
      content: fileContent,
      message: message || `Add ${filename}`,
    });

    if (result.success) {
      return {
        message: `📄 Successfully created "${filename}" in repository "${repo}"!\n\n✅ File URL: ${result.url}\n\nThe file has been created with default content. You can edit it directly on GitHub.`,
        action: {
          type: 'create_file',
          intent: 'File created successfully',
          parameters: { repo, filename, url: result.url },
          confidence: 1.0,
        },
        data: result.file,
        success: true,
      };
    } else {
      return {
        message: `❌ Failed to create file "${filename}" in repository "${repo}": ${result.error}\n\nThis might be because:\n• Repository doesn't exist\n• File already exists\n• Permission issues\n\nPlease check the repository name and try again.`,
        success: false,
      };
    }
  }

  // �️ HANDLE DELETE REPOSITORY
  private async handleDeleteRepository(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "❌ GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    const { name, confirm } = params;

    if (!name) {
      return {
        message: "❌ Please specify the repository name to delete.",
        success: false,
      };
    }

    // Get the actual username from GitHub API
    const username = this.githubAPI ? await this.getAuthenticatedUsername() : 'user';

    // Safety confirmation
    if (!confirm) {
      return {
        message: `⚠️ **DANGER ZONE** ⚠️\n\nYou are about to **PERMANENTLY DELETE** the repository "${name}".\n\n🚨 **This action CANNOT be undone!**\n\n**What will be lost:**\n• All code and files\n• All commit history\n• All issues and pull requests\n• All releases and tags\n• All collaborator access\n\nIf you're absolutely sure, please type: **"Yes, delete ${name} permanently"**`,
        success: false,
      };
    }

    const result = await this.githubAPI.deleteRepository({
      owner: username,
      name: name,
    });

    if (result.success) {
      return {
        message: `🗑️ **Repository "${name}" has been permanently deleted!**\n\n✅ The repository and all its contents have been removed from GitHub.\n\n⚠️ This action was irreversible. The repository is gone forever.`,
        action: {
          type: 'delete_repo',
          intent: 'Repository deleted successfully',
          parameters: { name, username },
          confidence: 1.0,
        },
        data: { deleted: true, name, username },
        success: true,
      };
    } else {
      return {
        message: `❌ Failed to delete repository "${name}": ${result.error}\n\nPossible reasons:\n• Repository doesn't exist\n• You don't have admin access\n• Repository name is incorrect`,
        success: false,
      };
    }
  }

  // �📊 SORT REPOSITORIES ACTION
  private async handleSortRepositories(params: any): Promise<AIResponse> {
    const { criteria, order } = params;
    
    if (!this.userContext.repositories.length) {
      return {
        message: "I don't have access to your repositories yet. Please refresh the page or connect your GitHub account.",
        success: false,
      };
    }

    let sortedRepos;
    let sortDescription;

    // Determine sorting mode based on criteria
    const sortingMode = criteria === 'complexity' ? 'portfolio' : 'cv';

    if (sortingMode === 'portfolio') {
      // Portfolio Mode: Sort by complexity (simple → complex)
      console.log('🔧 Sorting by complexity for portfolio mode');
      sortedRepos = [...this.userContext.repositories].sort((a, b) => {
        const complexityA = RepositorySorter.calculateComplexity(a).score;
        const complexityB = RepositorySorter.calculateComplexity(b).score;
        return complexityA - complexityB; // simple to complex
      });
      sortDescription = 'from simple to complex';
    } else {
      // CV Mode: Sort by date (newest → oldest)
      console.log('🔧 Sorting by date for CV mode');
      sortedRepos = [...this.userContext.repositories].sort((a, b) => {
        const dateA = new Date(a.updated_at).getTime();
        const dateB = new Date(b.updated_at).getTime();
        return dateB - dateA; // newest first
      });
      sortDescription = 'by recent activity';
    }

    // Generate bullet points with appropriate labels
    const bulletPoints = this.generateBulletPoints(sortedRepos, sortingMode);

    const modeDescription = sortingMode === 'portfolio'
      ? '📚 **Portfolio Mode** - Sorted by complexity (Simple → Advanced)'
      : '💼 **CV Mode** - Sorted by activity (Recent → Older)';

    const explanation = sortingMode === 'portfolio'
      ? '✨ Perfect for showcasing your learning journey and skill progression!'
      : '🎯 Perfect for recruiters who want to see your recent activity and current skills!';

    return {
      message: `${modeDescription}\n\n${bulletPoints}\n\n${explanation}`,
      action: {
        type: 'sort_repos',
        intent: `Repositories sorted for ${sortingMode} mode`,
        parameters: { criteria, order, mode: sortingMode, count: sortedRepos.length },
        confidence: 1.0,
      },
      data: sortedRepos,
      success: true,
    };
  }

  // 🏷️ GENERATE BULLET POINTS WITH LABELS
  private generateBulletPoints(repositories: Repository[], mode: 'cv' | 'portfolio'): string {
    return repositories.map((repo, index) => {
      const complexity = repo.complexity || RepositorySorter.calculateComplexity(repo);
      const label = this.getRepositoryLabel(repo, complexity, mode);
      const timeAgo = this.getTimeAgo(repo.updated_at);

      if (mode === 'cv') {
        // CV Mode: Show recent activity with highlights for complex projects
        return `• ${label} **${repo.name}** (${complexity.level}) - ${timeAgo}`;
      } else {
        // Portfolio Mode: Show progression story
        return `${index + 1}. ${label} **${repo.name}** (${complexity.level})`;
      }
    }).join('\n');
  }

  // 🏷️ GET REPOSITORY LABEL
  private getRepositoryLabel(repo: Repository, complexity: any, mode: 'cv' | 'portfolio'): string {
    const isRecent = this.isRecentProject(repo.updated_at);
    const isComplex = complexity.score >= 7;
    const isFullstack = this.isFullstackProject(repo);

    if (mode === 'cv') {
      // CV Mode: Prioritize recent activity
      if (isRecent && isComplex) return '⭐';
      if (isRecent) return '🚀';
      if (isFullstack) return '👨‍💻';
      return '📁';
    } else {
      // Portfolio Mode: Show progression
      if (isFullstack) return '👨‍💻';
      if (isComplex) return '⭐';
      if (isRecent) return '🚀';
      return '📁';
    }
  }

  // ⏰ HELPER METHODS
  private isRecentProject(updatedAt: string): boolean {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(updatedAt) > weekAgo;
  }

  private isFullstackProject(repo: Repository): boolean {
    const description = repo.description?.toLowerCase() || '';
    const name = repo.name.toLowerCase();
    return description.includes('fullstack') ||
           description.includes('full-stack') ||
           (description.includes('react') && description.includes('api')) ||
           name.includes('dashboard') ||
           name.includes('webapp');
  }

  private getTimeAgo(updatedAt: string): string {
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffInDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  // 🧠 ANALYZE COMPLEXITY ACTION
  private async handleAnalyzeComplexity(params: any): Promise<AIResponse> {
    if (!this.githubAPI) {
      return {
        message: "GitHub integration is not set up. Please connect your GitHub account first.",
        success: false,
      };
    }

    // 🔧 REAL COMPLEXITY ANALYSIS: Analyze actual repository data
    const repos = this.userContext.repositories;

    if (!repos || repos.length === 0) {
      return {
        message: "No repositories found to analyze. Please make sure your repositories are loaded.",
        success: false,
      };
    }

    // Analyze repository complexity based on real data
    const analysis = this.analyzeRepositoryComplexity(repos);

    const message = `🧠 **Repository Complexity Analysis Complete!**

📊 **Overview:**
• Total Repositories: ${repos.length}
• Languages Found: ${analysis.languages.join(', ')}
• Average Complexity Score: ${analysis.averageComplexity}/10

🏆 **Most Complex Repositories:**
${analysis.mostComplex.map((repo, i) => `${i + 1}. **${repo.name}** (${repo.complexity}/10) - ${repo.language || 'Unknown'}`).join('\n')}

📈 **Complexity Breakdown:**
• High Complexity (8-10): ${analysis.highComplexity} repos
• Medium Complexity (5-7): ${analysis.mediumComplexity} repos
• Low Complexity (1-4): ${analysis.lowComplexity} repos

💡 **Insights:**
${analysis.insights.join('\n')}

This analysis is based on repository size, language complexity, recent activity, and project structure.`;

    return {
      message,
      success: true,
    };
  }

  // 🔍 ANALYZE REPOSITORY COMPLEXITY HELPER
  private analyzeRepositoryComplexity(repos: any[]) {
    const languages = [...new Set(repos.map(repo => repo.language).filter(Boolean))];

    // Calculate complexity scores for each repo
    const reposWithComplexity = repos.map(repo => {
      let complexity = 1;

      // Language complexity scoring
      const languageComplexity: Record<string, number> = {
        'TypeScript': 8, 'JavaScript': 7, 'Python': 6, 'Java': 8, 'C++': 9, 'C#': 7,
        'Go': 6, 'Rust': 9, 'Swift': 7, 'Kotlin': 7, 'PHP': 5, 'Ruby': 6,
        'HTML': 2, 'CSS': 2, 'Shell': 4, 'Dockerfile': 3
      };

      if (repo.language && languageComplexity[repo.language]) {
        complexity += languageComplexity[repo.language];
      }

      // Size complexity (based on size in KB)
      if (repo.size > 10000) complexity += 2; // Large projects
      else if (repo.size > 1000) complexity += 1; // Medium projects

      // Recent activity bonus
      const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate < 7) complexity += 1; // Recently active

      // Stars/forks indicate complexity
      if (repo.stargazers_count > 10) complexity += 1;
      if (repo.forks_count > 5) complexity += 1;

      // Cap at 10
      complexity = Math.min(complexity, 10);

      return { ...repo, complexity };
    });

    const averageComplexity = Math.round(reposWithComplexity.reduce((sum, repo) => sum + repo.complexity, 0) / repos.length * 10) / 10;
    const mostComplex = reposWithComplexity.sort((a, b) => b.complexity - a.complexity).slice(0, 3);

    const highComplexity = reposWithComplexity.filter(repo => repo.complexity >= 8).length;
    const mediumComplexity = reposWithComplexity.filter(repo => repo.complexity >= 5 && repo.complexity < 8).length;
    const lowComplexity = reposWithComplexity.filter(repo => repo.complexity < 5).length;

    // Generate insights
    const insights = [];
    if (languages.includes('TypeScript')) insights.push('• Strong TypeScript usage indicates advanced development practices');
    if (highComplexity > repos.length * 0.3) insights.push('• High proportion of complex projects shows advanced technical skills');
    if (repos.some(repo => repo.forks_count > 0)) insights.push('• Forked repositories demonstrate open source contribution');
    if (repos.some(repo => new Date(repo.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) {
      insights.push('• Recent activity shows active development and maintenance');
    }

    return {
      languages,
      averageComplexity,
      mostComplex,
      highComplexity,
      mediumComplexity,
      lowComplexity,
      insights
    };
  }

  // 🎯 CV RECOMMENDATIONS ACTION
  private async handleCVRecommendations(params: any): Promise<AIResponse> {
    if (!this.userContext.repositories.length) {
      return {
        message: "I need access to your repositories to provide CV recommendations. Please refresh the page or connect your GitHub account.",
        success: false,
      };
    }

    const recommendations = RepositorySorter.generateCVRecommendations(this.userContext.repositories);
    
    let message = "🎯 **CV Optimization Recommendations**\n\n";
    
    recommendations.forEach(rec => {
      message += `## ${rec.title}\n${rec.description}\n\n`;
      
      if (rec.repositories) {
        rec.repositories.forEach((repo, index) => {
          message += `${index + 1}. **${repo.name}**`;
          if (repo.complexity) message += ` (${repo.complexity.level} - Score: ${repo.complexity.score})`;
          if (repo.description) message += `\n   📝 ${repo.description}`;
          if (repo.complexity?.factors.length) message += `\n   🔧 ${repo.complexity.factors.join(', ')}`;
          message += '\n\n';
        });
      }
    });

    message += "\n💡 **Pro Tips:**\n• Lead with your most complex projects\n• Ensure all featured repositories have good documentation\n• Keep repository names professional and descriptive\n• Add clear project descriptions\n\nWould you like me to sort your repositories in this recommended order?";

    return {
      message,
      action: {
        type: 'cv_recommendations',
        intent: 'CV optimization recommendations provided',
        parameters: { recommendationCount: recommendations.length },
        confidence: 1.0,
      },
      data: recommendations,
      success: true,
    };
  }

  // 🎤 START INTERVIEW ACTION
  private async handleStartInterview(params: any): Promise<AIResponse> {
    console.log('🎤 Starting portfolio interview...');

    // Initialize interview state
    this.interviewState = {
      isActive: true,
      currentQuestion: 0,
      questions: this.getInterviewQuestions(),
      answers: {},
      completed: false,
    };

    // 💾 SAVE STATE TO LOCALSTORAGE
    this.saveInterviewState();

    const firstQuestion = this.interviewState.questions[0];

    return {
      message: firstQuestion.question,
      action: {
        type: 'start_interview',
        intent: 'Started portfolio interview',
        parameters: {
          questionId: firstQuestion.id,
          totalQuestions: this.interviewState.questions.length,
          currentQuestion: 1
        },
        confidence: 1.0,
      },
      data: {
        interviewActive: true,
        currentQuestion: 1,
        totalQuestions: this.interviewState.questions.length,
        questionId: firstQuestion.id
      },
      success: true,
    };
  }

  // 🎤 HANDLE INTERVIEW ANSWER
  private async handleInterviewAnswer(params: any): Promise<AIResponse> {
    if (!this.interviewState.isActive) {
      return {
        message: "No interview is currently active. Would you like to start a portfolio interview?",
        success: false,
      };
    }

    const currentQuestion = this.interviewState.questions[this.interviewState.currentQuestion];
    const answer = params.answer || '';

    // Store the answer
    this.interviewState.answers[currentQuestion.id] = answer;

    // Move to next question
    this.interviewState.currentQuestion++;

    // 💾 SAVE STATE TO LOCALSTORAGE
    this.saveInterviewState();

    // Check if interview is complete
    if (this.interviewState.currentQuestion >= this.interviewState.questions.length) {
      this.interviewState.completed = true;
      this.interviewState.isActive = false;

      // 💾 CLEAR STATE FROM LOCALSTORAGE (interview complete)
      this.clearInterviewState();

      // Generate portfolio README based on answers
      const portfolioReadme = await this.generatePortfolioReadmeFromInterview();

      return {
        message: `🎉 **Interview Complete!**

Thank you for sharing your story! I've created a personalized portfolio README that captures your unique journey and passion.

Here's your custom README based on our conversation:

---

${portfolioReadme}

---

**Your README is ready to download!** This personal touch will help you stand out to recruiters and showcase the real person behind the code. 🚀`,
        action: {
          type: 'interview_answer',
          intent: 'Interview completed, README generated',
          parameters: {
            completed: true,
            readmeGenerated: true
          },
          confidence: 1.0,
        },
        data: {
          interviewCompleted: true,
          portfolioReadme,
          downloadReady: true
        },
        success: true,
      };
    }

    // Continue with next question
    const nextQuestion = this.interviewState.questions[this.interviewState.currentQuestion];

    return {
      message: `Great answer! 😊

${nextQuestion.question}`,
      action: {
        type: 'interview_answer',
        intent: 'Interview continuing',
        parameters: {
          questionId: nextQuestion.id,
          currentQuestion: this.interviewState.currentQuestion + 1,
          totalQuestions: this.interviewState.questions.length
        },
        confidence: 1.0,
      },
      data: {
        interviewActive: true,
        currentQuestion: this.interviewState.currentQuestion + 1,
        totalQuestions: this.interviewState.questions.length,
        questionId: nextQuestion.id,
        progress: Math.round(((this.interviewState.currentQuestion) / this.interviewState.questions.length) * 100)
      },
      success: true,
    };
  }

  // 📝 GENERATE PORTFOLIO README ACTION
  private async handleGeneratePortfolioReadme(params: any): Promise<AIResponse> {
    console.log('📝 Generating portfolio README...');

    if (this.userContext.repositories.length === 0) {
      return {
        message: "I need access to your repositories to generate a portfolio README. Please make sure your repositories are loaded first.",
        success: false,
      };
    }

    // Generate basic portfolio README without interview
    const portfolioReadme = await this.generateBasicPortfolioReadme();

    return {
      message: `📝 **Portfolio README Generated!**

I've created a comprehensive README based on your repository analysis:

---

${portfolioReadme}

---

**Want it more personalized?** Try saying "start interview" for a custom README that includes your personality and story! 🎤`,
      action: {
        type: 'generate_portfolio_readme',
        intent: 'Basic portfolio README generated',
        parameters: {
          repositoryCount: this.userContext.repositories.length,
          includePersonal: false
        },
        confidence: 1.0,
      },
      data: {
        portfolioReadme,
        downloadReady: true,
        suggestInterview: true
      },
      success: true,
    };
  }

  // 💬 GENERAL RESPONSE ACTION
  private async handleGeneralResponse(params: any): Promise<AIResponse> {
    const helpMessage = `🤖 **AI Assistant Ready**

I'm your GitHub repository assistant! I can help you with:

🚀 **Repository Management:**
• "Create a new repo named [name]"
• "Create a README file in my [repo] repository"
• "Sort my repos by complexity"

📊 **Analysis & Optimization:**
• "Analyze my repository complexity"
• "Sort repos for my CV"
• "Give me CV recommendations"

🎯 **Smart Organization:**
• Drag & drop to reorder repositories
• Intelligent sorting algorithms
• CV-optimized recommendations

**Examples:**
• "Create a new repo named Hello World"
• "Sort repos from simple to complex for my CV"
• "Create a README in my portfolio repo"

What would you like me to help you with?`;

    return {
      message: helpMessage,
      success: true,
    };
  }

  // 🔄 FALLBACK PARSING (Simple Pattern Matching)
  private fallbackParsing(message: string): AIAction {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('create') && lowerMessage.includes('repo')) {
      const nameMatch = message.match(/(?:named?|called?)\s+["']?([^"']+)["']?/i);
      return {
        type: 'create_repo',
        intent: 'Create repository',
        parameters: { name: nameMatch?.[1] || 'new-repository' },
        confidence: 0.8,
      };
    }
    
    // HIGHEST PRIORITY: Sort repositories by complexity (even if CV is mentioned)
    if (lowerMessage.includes('sort') && (lowerMessage.includes('complex') || lowerMessage.includes('simple') || lowerMessage.includes('difficulty'))) {
      return {
        type: 'sort_repos',
        intent: 'Sort repositories by complexity',
        parameters: { criteria: 'complexity', order: 'asc' },
        confidence: 0.95,
      };
    }

    // LOWER PRIORITY: CV recommendations only if no complexity sorting requested
    if (lowerMessage.includes('sort') && lowerMessage.includes('cv') && !lowerMessage.includes('complex') && !lowerMessage.includes('simple') && !lowerMessage.includes('difficulty')) {
      return {
        type: 'cv_recommendations',
        intent: 'CV optimization recommendations',
        parameters: {},
        confidence: 0.8,
      };
    }

    // 🎤 START INTERVIEW
    if (lowerMessage.includes('start') && lowerMessage.includes('interview')) {
      return {
        type: 'start_interview',
        intent: 'Start portfolio interview',
        parameters: {},
        confidence: 0.9,
      };
    }

    // 📝 GENERATE PORTFOLIO README
    if (lowerMessage.includes('portfolio') && lowerMessage.includes('readme')) {
      return {
        type: 'generate_portfolio_readme',
        intent: 'Generate portfolio README',
        parameters: {},
        confidence: 0.8,
      };
    }

    return {
      type: 'general_response',
      intent: 'General help',
      parameters: {},
      confidence: 0.5,
    };
  }

  // 📝 UPDATE USER CONTEXT
  updateContext(repositories: any[], preferences?: any) {
    this.userContext.repositories = repositories;
    if (preferences) {
      this.userContext.preferences = { ...this.userContext.preferences, ...preferences };
    }
  }

  // 💬 ADD TO CONVERSATION HISTORY
  addToHistory(role: 'user' | 'assistant', content: string) {
    this.userContext.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Keep only last 20 messages
    if (this.userContext.conversationHistory.length > 20) {
      this.userContext.conversationHistory = this.userContext.conversationHistory.slice(-20);
    }
  }

  // 🔍 GET AUTHENTICATED USERNAME
  private async getAuthenticatedUsername(): Promise<string> {
    if (!this.githubAPI) return 'user';

    try {
      // Use the GitHub API to get the authenticated user
      const response = await (this.githubAPI as any).octokit.request('GET /user');
      return response.data.login;
    } catch (error) {
      console.error('❌ Failed to get authenticated username:', error);
      return 'user';
    }
  }

  // 🎨 GENERATE PORTFOLIO README FROM INTERVIEW
  private async generatePortfolioReadmeFromInterview(): Promise<string> {
    const answers = this.interviewState.answers;
    const repos = this.userContext.repositories;

    // Analyze repositories for tech stack and recent projects
    const repoAnalysis = this.analyzeRepositories(repos);
    const recentProjects = this.getRecentProjects(repos, 3);

    // Extract personal info from interview answers
    const personalData: PortfolioData = {
      name: this.extractNameFromAnswer(answers.name_passion),
      codingPassion: this.extractPassionFromAnswer(answers.name_passion),
      recentExcitement: answers.recent_excitement,
      careerGoals: answers.career_goals,
      hobbies: answers.hobbies_personality,
      techFocus: answers.tech_focus,
      personalStory: answers.personal_story,
    };

    return this.buildPersonalizedReadme(personalData, repoAnalysis, recentProjects);
  }

  // 🎨 GENERATE BASIC PORTFOLIO README
  private async generateBasicPortfolioReadme(): Promise<string> {
    const repos = this.userContext.repositories;
    const repoAnalysis = this.analyzeRepositories(repos);
    const recentProjects = this.getRecentProjects(repos, 3);

    const basicData: PortfolioData = {
      name: "Developer", // Default name
      codingPassion: "building innovative solutions",
      techFocus: repoAnalysis.primaryLanguages.join(", "),
    };

    return this.buildPersonalizedReadme(basicData, repoAnalysis, recentProjects);
  }

  // 📊 ANALYZE REPOSITORIES
  private analyzeRepositories(repos: any[]) {
    const languages: Record<string, number> = {};
    const frameworks: string[] = [];
    let totalStars = 0;
    let mostStarredRepo = null;
    let maxStars = 0;

    repos.forEach(repo => {
      // Count languages
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }

      // Track stars
      totalStars += repo.stargazers_count || 0;
      if ((repo.stargazers_count || 0) > maxStars) {
        maxStars = repo.stargazers_count || 0;
        mostStarredRepo = repo;
      }

      // Detect frameworks (basic detection)
      if (repo.name.includes('react') || repo.description?.toLowerCase().includes('react')) {
        frameworks.push('React');
      }
      if (repo.name.includes('next') || repo.description?.toLowerCase().includes('next')) {
        frameworks.push('Next.js');
      }
      if (repo.name.includes('vue') || repo.description?.toLowerCase().includes('vue')) {
        frameworks.push('Vue.js');
      }
    });

    const primaryLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang);

    return {
      primaryLanguages,
      frameworks: [...new Set(frameworks)],
      totalStars,
      mostStarredRepo,
      totalRepos: repos.length,
      languages
    };
  }

  // 📅 GET RECENT PROJECTS
  private getRecentProjects(repos: any[], count: number = 3) {
    return repos
      .filter(repo => !repo.fork) // Exclude forks
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, count);
  }

  // 🎭 BUILD PERSONALIZED README
  private buildPersonalizedReadme(data: PortfolioData, analysis: any, recentProjects: any[]): string {
    const name = data.name || "Developer";
    const passion = data.codingPassion || "building innovative solutions";
    const hobbies = data.hobbies ? ` When I'm not coding, ${data.hobbies.toLowerCase()}.` : "";

    let readme = `# Hey, I'm ${name}! 👋\n\n`;

    // Personal intro
    readme += `I'm a passionate developer who loves ${passion}.${hobbies}\n\n`;

    // What drives me section
    if (data.careerGoals) {
      readme += `## 🚀 What drives me\n`;
      readme += `${data.careerGoals}\n\n`;
    }

    // Tech journey
    readme += `## 💻 My Tech Journey\n`;
    if (data.techFocus) {
      readme += `I'm currently focused on ${data.techFocus}. `;
    }
    readme += `I work primarily with ${analysis.primaryLanguages.join(", ")}`;
    if (analysis.frameworks.length > 0) {
      readme += ` and love building with ${analysis.frameworks.join(", ")}`;
    }
    readme += `.\n\n`;

    // Recent projects
    if (data.recentExcitement) {
      readme += `## 🔥 What I'm excited about lately\n`;
      readme += `${data.recentExcitement}\n\n`;
    }

    if (recentProjects.length > 0) {
      readme += `## 🚀 Recent Projects\n\n`;
      recentProjects.forEach(project => {
        readme += `**${project.name}** - ${project.description || "An exciting project I've been working on"}\n`;
      });
      readme += `\n`;
    }

    // Tech stack
    readme += `## 🛠️ Technologies I work with\n\n`;
    readme += `**Languages:** ${analysis.primaryLanguages.join(" • ")}\n`;
    if (analysis.frameworks.length > 0) {
      readme += `**Frameworks:** ${analysis.frameworks.join(" • ")}\n`;
    }
    readme += `**Total Repositories:** ${analysis.totalRepos}\n`;
    if (analysis.totalStars > 0) {
      readme += `**GitHub Stars:** ${analysis.totalStars} ⭐\n`;
    }
    readme += `\n`;

    // Personal story
    if (data.personalStory) {
      readme += `## 🌟 My Story\n`;
      readme += `${data.personalStory}\n\n`;
    }

    // GitHub stats
    readme += `## 📊 GitHub Stats\n\n`;
    readme += `![GitHub Stats](https://github-readme-stats.vercel.app/api?username=YOUR_USERNAME&show_icons=true&theme=radical)\n\n`;

    // What's next
    if (data.careerGoals) {
      readme += `## 🎯 What's Next\n`;
      readme += `I'm always looking for new challenges and opportunities to grow. ${data.careerGoals}\n\n`;
    }

    readme += `---\n\n`;
    readme += `💬 **Let's connect!** I'm always excited to collaborate on interesting projects or just chat about tech.\n`;

    return readme;
  }

  // 🔍 EXTRACT NAME FROM ANSWER
  private extractNameFromAnswer(answer: string): string {
    if (!answer) return "Developer";

    // Look for "I'm [name]" or "My name is [name]" patterns
    const patterns = [
      /(?:i'm|i am)\s+([a-zA-Z]+)/i,
      /(?:my name is|name is)\s+([a-zA-Z]+)/i,
      /^([a-zA-Z]+)(?:\s|,|\.)/,
    ];

    for (const pattern of patterns) {
      const match = answer.match(pattern);
      if (match && match[1]) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      }
    }

    return "Developer";
  }

  // 💝 EXTRACT PASSION FROM ANSWER
  private extractPassionFromAnswer(answer: string): string {
    if (!answer) return "building innovative solutions";

    // Look for passion indicators
    const passionKeywords = ["love", "passionate", "enjoy", "excited", "fascinated"];
    const lowerAnswer = answer.toLowerCase();

    for (const keyword of passionKeywords) {
      const index = lowerAnswer.indexOf(keyword);
      if (index !== -1) {
        // Extract the part after the passion keyword
        const afterKeyword = answer.substring(index + keyword.length).trim();
        if (afterKeyword.length > 0) {
          return afterKeyword.split('.')[0].trim();
        }
      }
    }

    return "building innovative solutions";
  }
}

// 🌟 SINGLETON INSTANCE
export const aiAssistant = new AIAssistantEngine();
