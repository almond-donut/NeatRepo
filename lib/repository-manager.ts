// ULTRA-FAST repository manager - TARGET: 1-3 SECOND LOADING 🚀
class RepositoryManager {
  private static instance: RepositoryManager;
  private repositories: any[] = [];
  private lastFetch: number = 0;
  private isInitialized: boolean = false;
  private listeners: Set<(repos: any[]) => void> = new Set();
  private streamingListeners: Set<(repo: any) => void> = new Set();
  private isFetching: boolean = false;
  private loadingStartTime: number = 0;

  private constructor() {
    this.loadFromCache();
  }

  static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  private loadFromCache(userId?: string) {
    // Skip on server side
    if (typeof window === 'undefined') return false;

    try {
      // Try user-specific cache first, then fall back to global cache
      const cacheKey = userId ? `github_repositories_${userId}` : 'github_repositories';
      const timeKey = userId ? `github_repositories_time_${userId}` : 'github_repositories_time';

      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(timeKey);

      if (cached && cacheTime) {
        const timeSinceCache = Date.now() - parseInt(cacheTime);
        // 🚀 IMPROVED UX: Only use cache if very recent (5 minutes) for better freshness
        if (timeSinceCache < 300000) { // 5 minutes instead of 1 hour
          this.repositories = JSON.parse(cached);
          this.lastFetch = parseInt(cacheTime);
          this.isInitialized = true;
          console.log(`⚡ SINGLETON: Loaded ${this.repositories.length} repositories from ${userId ? 'user-specific' : 'global'} cache (${Math.round(timeSinceCache/1000)}s old)`);
          this.notifyListeners();
          return true;
        } else {
          console.log(`🔄 SINGLETON: Cache is stale (${Math.round(timeSinceCache/60000)} minutes old), will fetch fresh data`);
        }
      }
    } catch (error) {
      console.log('📁 SINGLETON: Cache load failed:', error);
    }
    return false;
  }

  private saveToCache(userId?: string) {
    // Skip on server side
    if (typeof window === 'undefined') return;

    try {
      // Save to user-specific cache if userId provided, otherwise global cache
      const cacheKey = userId ? `github_repositories_${userId}` : 'github_repositories';
      const timeKey = userId ? `github_repositories_time_${userId}` : 'github_repositories_time';

      localStorage.setItem(cacheKey, JSON.stringify(this.repositories));
      localStorage.setItem(timeKey, Date.now().toString());
      this.lastFetch = Date.now();
      console.log(`💾 SINGLETON: Repositories cached to ${userId ? 'user-specific' : 'global'} storage`);
    } catch (error) {
      console.log('📁 SINGLETON: Cache save failed:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.repositories]));
  }

  subscribe(listener: (repos: any[]) => void): () => void {
    this.listeners.add(listener);
    // Immediately provide current data
    listener([...this.repositories]);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  getRepositories(): any[] {
    return [...this.repositories];
  }

  // Add streaming listener for real-time updates
  addStreamingListener(listener: (repo: any) => void): () => void {
    this.streamingListeners.add(listener);
    return () => {
      this.streamingListeners.delete(listener);
    };
  }

  private notifyStreamingListeners(repo: any) {
    this.streamingListeners.forEach(listener => {
      try {
        listener(repo);
      } catch (error) {
        console.error('🚨 SINGLETON: Streaming listener error:', error);
      }
    });
  }

  async fetchRepositories(token: string, forceRefresh = false, userId?: string): Promise<void> {
    // 🚨 CRITICAL DEBUG: Log token information (safely)
    console.log('🔑 SINGLETON: Starting fetch with token:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 7) + '...',
      forceRefresh
    });

    // Validate token before proceeding – if missing, try public-repo fallback instead of hard-erroring
    if (!token || token.trim() === '') {
      console.warn(' SINGLETON: No GitHub token – attempting public-repo fallback');

      // If we have the GitHub username cached we can still show public repos (read-only)
      if (typeof window !== 'undefined') {
        const cachedUsername =
          (userId ? localStorage.getItem(`github_username_${userId}`) : null) ||
          localStorage.getItem('github_username');

        if (cachedUsername) {
          try {
            const res = await fetch(`https://api.github.com/users/${cachedUsername}/repos?per_page=100`);
            if (res.ok) {
              this.repositories = await res.json();
              console.log(` SINGLETON: Loaded public repos for ${cachedUsername} (count: ${this.repositories.length})`);
              this.saveToCache(userId);
              this.notifyListeners();
              return; // Success – no token required
            }
            console.error(' SINGLETON: Public-repo fetch failed', res.status);
          } catch (publicErr) {
            console.error(' SINGLETON: Exception during public-repo fetch', publicErr);
          }
        }
      }

      // Still no data – propagate original error
      throw new Error('No GitHub token available for repository access');
    }

    // IMPROVED UX: Always fetch fresh data unless explicitly using cache
    // Only skip if we have recent data (less than 5 minutes old) and not forced
    if (!forceRefresh && this.repositories.length > 0) {
      const timeSinceLastFetch = Date.now() - this.lastFetch;
      if (timeSinceLastFetch < 300000) { // 5 minutes
        console.log(' SINGLETON: Using recent data, INSTANT LOAD!');
        console.log('⚡ SINGLETON: Using recent data, INSTANT LOAD!');
        return;
      } else {
        console.log('🔄 SINGLETON: Data is stale, fetching fresh repositories...');
      }
    }

    // Prevent multiple simultaneous fetches
    if (this.isFetching) {
      console.log('⏳ SINGLETON: Fetch already in progress');
      return;
    }

    this.isFetching = true;
    this.loadingStartTime = Date.now();

    try {
      console.log('🚀 SINGLETON: ULTRA-FAST FETCH STARTING...');

      // PARALLEL REQUESTS for maximum speed
      console.log('🌐 SINGLETON: Making parallel GitHub API requests...');
      const [userRepos, starredRepos] = await Promise.allSettled([
        fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }),
        fetch("https://api.github.com/user/starred?per_page=20", {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
      ]);

      console.log('🌐 SINGLETON: API requests completed:', {
        userReposStatus: userRepos.status,
        starredReposStatus: starredRepos.status
      });

      let repos: any[] = [];

      // Process user repos
      if (userRepos.status === 'fulfilled' && userRepos.value.ok) {
        const userReposData = await userRepos.value.json();
        repos = userReposData;

        // STREAMING: Notify as data arrives
        userReposData.forEach((repo: any, index: number) => {
          setTimeout(() => {
            this.notifyStreamingListeners(repo);
          }, index * 10); // Stagger for smooth streaming effect
        });
      }

      const fetchTime = Date.now() - this.loadingStartTime;

      console.log(`🚀 ULTRA-FAST: Loaded ${repos.length} repositories in ${fetchTime}ms`);

      // PERFORMANCE METRICS
      if (fetchTime < 1000) {
        console.log('🏆 PERFORMANCE: SUB-1-SECOND LOADING ACHIEVED!');
      } else if (fetchTime < 2000) {
        console.log('⚡ PERFORMANCE: SUB-2-SECOND LOADING!');
      } else if (fetchTime < 3000) {
        console.log('✅ PERFORMANCE: SUB-3-SECOND LOADING!');
      }

      this.repositories = repos;
      this.lastFetch = Date.now();
      this.isInitialized = true;
      this.saveToCache(userId);
      this.notifyListeners();

    } catch (error) {
      console.error('❌ SINGLETON: Fetch error:', error);

      // 🚨 CRITICAL DEBUG: Log detailed error information
      if (error instanceof Error) {
        console.error('❌ SINGLETON: Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }

      // Check if it's a token-related error
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.error('🔑 SINGLETON: Token appears to be invalid or expired');
        // Clear cached data for invalid tokens
        this.clearCache();
      }

      // Fallback to cached data if available
      if (this.repositories.length > 0) {
        console.log('🔄 SINGLETON: Using cached data as fallback');
        this.notifyListeners();
      } else {
        // If no cached data, ensure listeners are still notified with empty array
        console.log('🔄 SINGLETON: No cached data available, notifying with empty state');
        this.notifyListeners();
      }
      throw error;
    } finally {
      this.isFetching = false;
      console.log('🔄 SINGLETON: Fetch operation completed, isFetching reset to false');
    }
  }

  isDataAvailable(): boolean {
    return this.repositories.length > 0;
  }

  getLastFetchTime(): number {
    return this.lastFetch;
  }

  // 🎯 YOUTUBE-STYLE: Enhanced background sync with long-term resilience
  async backgroundSync(token: string): Promise<void> {
    console.log('🔄 SINGLETON: Background sync starting...');
    
    try {
      // Test token validity first before attempting sync
      const tokenTest = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!tokenTest.ok) {
        if (tokenTest.status === 401) {
          console.error('🔑 SINGLETON: GitHub token expired or invalid');
          // Clear cached data if token is invalid
          this.clearCache();
          throw new Error('GitHub token expired');
        }
        throw new Error(`GitHub API error: ${tokenTest.status}`);
      }

      // If we have stale data (older than 1 hour), force refresh
      const timeSinceLastFetch = Date.now() - this.lastFetch;
      const forceRefresh = timeSinceLastFetch > 3600000; // 1 hour
      
      if (forceRefresh) {
        console.log('🔄 SINGLETON: Data is very stale (>1h), forcing refresh...');
      }

      await this.fetchRepositories(token, forceRefresh);
      console.log('✅ SINGLETON: Background sync completed successfully');
    } catch (error) {
      console.error('❌ SINGLETON: Background sync failed:', error);
      
      // If sync fails but we have cached data, keep using it
      if (this.repositories.length > 0) {
        console.log('🔄 SINGLETON: Using cached data due to sync failure');
        this.notifyListeners();
      }
    }
  }

  // Clear cache method for token expiry scenarios
  private clearCache(userId?: string): void {
    if (typeof window !== 'undefined') {
      if (userId) {
        localStorage.removeItem(`github_repositories_${userId}`);
        localStorage.removeItem(`github_repositories_time_${userId}`);
        console.log(`🗑️ SINGLETON: User-specific cache cleared for ${userId}`);
      } else {
        localStorage.removeItem('github_repositories');
        localStorage.removeItem('github_repositories_time');
        console.log('🗑️ SINGLETON: Global cache cleared due to token issues');
      }
    }
  }
}

export const repositoryManager = RepositoryManager.getInstance();
