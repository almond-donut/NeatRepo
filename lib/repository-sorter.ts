// Repository Sorting and Complexity Analysis Engine
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  html_url: string;
  size?: number;
  open_issues_count?: number;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  archived?: boolean;
  disabled?: boolean;
  pushed_at?: string;
  complexity?: RepositoryComplexity;
  topics?: string[];
  private?: boolean;
  owner?: {
    login: string;
    avatar_url: string;
  };
}

export interface RepositoryComplexity {
  score: number;
  level: 'Simple' | 'Intermediate' | 'Complex' | 'Advanced';
  factors: string[];
  reasoning: string;
}

export interface CVRecommendation {
  title: string;
  description: string;
  repositories?: Repository[];
  priority: number;
}

export class RepositorySorter {
  // 🧮 CALCULATE REPOSITORY COMPLEXITY
  static calculateComplexity(repo: Repository): RepositoryComplexity {
    let score = 0;
    const factors: string[] = [];

    // Language complexity scoring
    const languageScores: Record<string, number> = {
      'TypeScript': 4,
      'JavaScript': 3,
      'Python': 3,
      'Java': 4,
      'C++': 5,
      'C#': 4,
      'Go': 4,
      'Rust': 5,
      'Swift': 4,
      'Kotlin': 4,
      'PHP': 2,
      'Ruby': 3,
      'HTML': 1,
      'CSS': 1,
      'Shell': 2,
      'Dockerfile': 2,
    };

    if (repo.language) {
      const langScore = languageScores[repo.language] || 2;
      score += langScore;
      factors.push(`${repo.language} (${langScore}pts)`);
    }

    // Repository size and activity
    const size = repo.size || 0;
    if (size > 10000) {
      score += 3;
      factors.push('Large codebase (3pts)');
    } else if (size > 1000) {
      score += 2;
      factors.push('Medium codebase (2pts)');
    } else if (size > 100) {
      score += 1;
      factors.push('Small codebase (1pt)');
    }

    // Community engagement
    const stars = repo.stargazers_count || 0;
    const forks = repo.forks_count || 0;
    if (stars > 50 || forks > 10) {
      score += 2;
      factors.push('High engagement (2pts)');
    } else if (stars > 10 || forks > 2) {
      score += 1;
      factors.push('Some engagement (1pt)');
    }

    // Documentation and features
    if (repo.has_wiki) {
      score += 1;
      factors.push('Has wiki (1pt)');
    }
    if (repo.has_issues && (repo.open_issues_count || 0) > 0) {
      score += 1;
      factors.push('Active issues (1pt)');
    }
    if (repo.has_projects) {
      score += 1;
      factors.push('Project boards (1pt)');
    }

    // Topics/tags indicate thoughtful organization
    if (repo.topics && repo.topics.length > 0) {
      score += Math.min(repo.topics.length, 3);
      factors.push(`${repo.topics.length} topics (${Math.min(repo.topics.length, 3)}pts)`);
    }

    // Recent activity
    const lastUpdate = new Date(repo.updated_at);
    const monthsAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 1) {
      score += 2;
      factors.push('Very recent activity (2pts)');
    } else if (monthsAgo < 6) {
      score += 1;
      factors.push('Recent activity (1pt)');
    }

    // Determine complexity level
    let level: RepositoryComplexity['level'];
    let reasoning: string;

    if (score <= 4) {
      level = 'Simple';
      reasoning = 'Basic project with minimal complexity and dependencies';
    } else if (score <= 8) {
      level = 'Intermediate';
      reasoning = 'Well-structured project with moderate complexity';
    } else if (score <= 12) {
      level = 'Complex';
      reasoning = 'Advanced project with multiple technologies and features';
    } else {
      level = 'Advanced';
      reasoning = 'Highly sophisticated project with extensive features and engagement';
    }

    return {
      score,
      level,
      factors,
      reasoning,
    };
  }

  // SORT BY COMPLEXITY
  static sortByComplexity(repositories: Repository[], order: 'asc' | 'desc' = 'asc'): Repository[] {
    return repositories.sort((a, b) => {
      const complexityA = a.complexity || this.calculateComplexity(a);
      const complexityB = b.complexity || this.calculateComplexity(b);

      const scoreA = complexityA.score;
      const scoreB = complexityB.score;

      return order === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    });
  }

  // SORT FOR CV OPTIMIZATION
  static sortForCV(repositories: Repository[]): Repository[] {
    return repositories.sort((a, b) => {
      const complexityA = a.complexity || this.calculateComplexity(a);
      const complexityB = b.complexity || this.calculateComplexity(b);

      // Primary: Complexity score (higher first for CV)
      const complexityDiff = complexityB.score - complexityA.score;
      if (complexityDiff !== 0) return complexityDiff;

      // Secondary: Recent activity
      const aDate = new Date(a.updated_at).getTime();
      const bDate = new Date(b.updated_at).getTime();
      const dateDiff = bDate - aDate;
      if (dateDiff !== 0) return dateDiff;

      // Tertiary: Community engagement
      const aEngagement = (a.stargazers_count || 0) + (a.forks_count || 0);
      const bEngagement = (b.stargazers_count || 0) + (b.forks_count || 0);
      return bEngagement - aEngagement;
    });
  }

  // GENERATE CV RECOMMENDATIONS
  static generateCVRecommendations(repositories: Repository[]): CVRecommendation[] {
    const recommendations: CVRecommendation[] = [];

    // Add complexity analysis to repositories
    const reposWithComplexity = repositories.map(repo => ({
      ...repo,
      complexity: repo.complexity || this.calculateComplexity(repo),
    }));

    // Top Complex Projects
    const complexProjects = reposWithComplexity
      .filter(repo => repo.complexity!.score >= 8)
      .sort((a, b) => b.complexity!.score - a.complexity!.score)
      .slice(0, 3);

    if (complexProjects.length > 0) {
      recommendations.push({
        title: '⭐ Showcase Projects (Lead with these)',
        description: 'Your most complex and impressive repositories that demonstrate advanced skills.',
        repositories: complexProjects,
        priority: 1,
      });
    }

    // Recent Active Projects
    const recentProjects = reposWithComplexity
      .filter(repo => {
        const monthsAgo = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsAgo < 3 && repo.complexity!.score >= 4;
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);

    if (recentProjects.length > 0) {
      recommendations.push({
        title: 'Recent Work (Show current activity)',
        description: 'Recently updated projects that show you\'re actively coding.',
        repositories: recentProjects,
        priority: 2,
      });
    }

    // Well-Documented Projects
    const documentedProjects = reposWithComplexity
      .filter(repo => repo.has_wiki || repo.description || (repo.topics && repo.topics.length > 0))
      .sort((a, b) => b.complexity!.score - a.complexity!.score)
      .slice(0, 3);

    if (documentedProjects.length > 0) {
      recommendations.push({
        title: 'Well-Documented Projects',
        description: 'Projects with good documentation that show your communication skills.',
        repositories: documentedProjects,
        priority: 3,
      });
    }

    return recommendations;
  }
}
