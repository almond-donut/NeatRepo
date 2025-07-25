'use client';

import { useState } from 'react';
import { RepositorySorter, Repository } from '@/lib/repository-sorter';

// Mock repository data for testing
const mockRepositories: Repository[] = [
  {
    id: 1,
    name: 'hello-world',
    full_name: 'almond-donut/hello-world',
    description: 'My first repository',
    language: 'JavaScript',
    stargazers_count: 2,
    forks_count: 0,
    updated_at: '2024-01-15T10:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    html_url: 'https://github.com/almond-donut/hello-world',
    size: 50,
    has_issues: true,
    has_projects: false,
    has_wiki: false,
    open_issues_count: 1,
    topics: ['beginner'],
  },
  {
    id: 2,
    name: 'react-dashboard',
    full_name: 'almond-donut/react-dashboard',
    description: 'Advanced React dashboard with TypeScript and real-time features',
    language: 'TypeScript',
    stargazers_count: 25,
    forks_count: 5,
    updated_at: '2024-07-20T15:30:00Z',
    created_at: '2024-06-01T10:00:00Z',
    html_url: 'https://github.com/almond-donut/react-dashboard',
    size: 15000,
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    open_issues_count: 8,
    topics: ['react', 'typescript', 'dashboard', 'real-time'],
  },
  {
    id: 3,
    name: 'python-scraper',
    full_name: 'almond-donut/python-scraper',
    description: 'Web scraping tool with data analysis',
    language: 'Python',
    stargazers_count: 12,
    forks_count: 3,
    updated_at: '2024-07-10T12:00:00Z',
    created_at: '2024-05-15T10:00:00Z',
    html_url: 'https://github.com/almond-donut/python-scraper',
    size: 5000,
    has_issues: true,
    has_projects: false,
    has_wiki: false,
    open_issues_count: 3,
    topics: ['python', 'scraping', 'data-analysis'],
  },
  {
    id: 4,
    name: 'css-animations',
    full_name: 'almond-donut/css-animations',
    description: 'Collection of CSS animations and effects',
    language: 'CSS',
    stargazers_count: 8,
    forks_count: 1,
    updated_at: '2024-03-20T14:00:00Z',
    created_at: '2024-03-01T10:00:00Z',
    html_url: 'https://github.com/almond-donut/css-animations',
    size: 200,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    open_issues_count: 0,
    topics: ['css', 'animations'],
  },
  {
    id: 5,
    name: 'rust-cli-tool',
    full_name: 'almond-donut/rust-cli-tool',
    description: 'High-performance CLI tool built with Rust',
    language: 'Rust',
    stargazers_count: 45,
    forks_count: 12,
    updated_at: '2024-07-22T09:15:00Z',
    created_at: '2024-04-01T10:00:00Z',
    html_url: 'https://github.com/almond-donut/rust-cli-tool',
    size: 8000,
    has_issues: true,
    has_projects: true,
    has_wiki: true,
    open_issues_count: 15,
    topics: ['rust', 'cli', 'performance', 'systems-programming'],
  },
];

export default function TestSortingPage() {
  const [repositories, setRepositories] = useState<Repository[]>(mockRepositories);
  const [sortMode, setSortMode] = useState<string>('original');

  const handleSort = (mode: string) => {
    let sorted: Repository[];
    
    switch (mode) {
      case 'complexity-asc':
        sorted = RepositorySorter.sortByComplexity([...repositories], 'asc');
        break;
      case 'complexity-desc':
        sorted = RepositorySorter.sortByComplexity([...repositories], 'desc');
        break;
      case 'cv-optimized':
        sorted = RepositorySorter.sortForCV([...repositories]);
        break;
      default:
        sorted = [...mockRepositories];
    }
    
    setRepositories(sorted);
    setSortMode(mode);
  };

  const getComplexityInfo = (repo: Repository) => {
    const complexity = RepositorySorter.calculateComplexity(repo);
    return complexity;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Repository Sorting Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Sorting Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleSort('original')}
              className={`px-4 py-2 rounded-md ${
                sortMode === 'original'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Original Order
            </button>
            <button
              onClick={() => handleSort('complexity-asc')}
              className={`px-4 py-2 rounded-md ${
                sortMode === 'complexity-asc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Simple → Complex
            </button>
            <button
              onClick={() => handleSort('complexity-desc')}
              className={`px-4 py-2 rounded-md ${
                sortMode === 'complexity-desc'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Complex → Simple
            </button>
            <button
              onClick={() => handleSort('cv-optimized')}
              className={`px-4 py-2 rounded-md ${
                sortMode === 'cv-optimized'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              CV Optimized
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current mode: <span className="font-semibold">{sortMode}</span>
          </p>
        </div>

        <div className="space-y-4">
          {repositories.map((repo, index) => {
            const complexity = getComplexityInfo(repo);
            return (
              <div key={repo.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-500">
                        #{index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {repo.name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                        {repo.language}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{repo.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                      <span>📦 {repo.size} KB</span>
                      <span>📅 {new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      complexity.level === 'Simple' ? 'bg-green-100 text-green-800' :
                      complexity.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      complexity.level === 'Complex' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {complexity.level}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      Score: {complexity.score}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {complexity.factors.slice(0, 2).join(', ')}
                      {complexity.factors.length > 2 && '...'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 CV Recommendations</h2>
          <button
            onClick={() => {
              const recommendations = RepositorySorter.generateCVRecommendations(repositories);
              console.log('CV Recommendations:', recommendations);
              alert(`Generated ${recommendations.length} CV recommendations. Check console for details.`);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Generate CV Recommendations
          </button>
        </div>
      </div>
    </div>
  );
}
