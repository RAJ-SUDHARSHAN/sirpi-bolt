import { auth } from "@clerk/nextjs/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Declare Clerk global type
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

// Helper function to get auth headers
const getAuthHeaders = async () => {
  // For client-side usage
  if (typeof window !== "undefined") {
    const token = await window.Clerk?.session?.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // For server-side usage
  try {
    const { getToken } = await auth();
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  } catch {
    return {
      "Content-Type": "application/json",
    };
  }
};

// Types for GitHub API responses
export interface GitHubInstallation {
  id: string;
  installation_id: string;
  account_name: string;
  account_type: string;
  account_avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubConnectionStatus {
  connected: boolean;
  installation_id: string | null;
  account_name: string | null;
  account_type: string | null;
  repositories_count: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface ImportedRepository {
  id: string;
  github_id: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  default_branch: string;
  is_private: boolean;
  is_fork: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  status_code?: number;
  data?: T;
  error?: string;
}

// GitHub API client
export const githubApi = {
  // Get GitHub App installation URL
  getInstallUrl: () => `${API_BASE_URL}/api/github/install`,

  // Get GitHub auth URL for OAuth
  getAuthUrl: () => `${API_BASE_URL}/api/github/install`,

  // Connect a GitHub App installation to the current user
  async connectInstallation(installationId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/github/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          installation_id: installationId,
        }),
      });

      const data: ApiResponse<{
        installation_id: string;
        account_name: string;
        account_type: string;
      }> = await response.json();
      return data.success || false;
    } catch (error) {
      console.error("Error connecting GitHub installation:", error);
      return false;
    }
  },

  // Get GitHub connection status
  async getStatus(): Promise<GitHubConnectionStatus | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/github/status`, {
        headers,
      });

      const data: ApiResponse<GitHubConnectionStatus> = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching GitHub status:", error);
      return null;
    }
  },

  // Get GitHub installation info
  async getInstallation(): Promise<GitHubInstallation | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/github/installation`, {
        headers,
      });

      const data: ApiResponse<GitHubInstallation> = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching GitHub installation:", error);
      return null;
    }
  },

  // Get repositories from GitHub App
  async getRepositories(): Promise<GitHubRepository[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/github/repositories`, {
        headers,
      });

      const data: ApiResponse<{
        repositories: GitHubRepository[];
        total_count: number;
      }> = await response.json();
      return data.success && data.data ? data.data.repositories : [];
    } catch (error) {
      console.error("Error fetching GitHub repositories:", error);
      return [];
    }
  },

  // Check if user has GitHub connected
  async isConnected(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status?.connected || false;
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      return false;
    }
  },

  // Import a repository
  async importRepository(fullName: string): Promise<ImportedRepository | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/github/repos/import`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          full_name: fullName,
        }),
      });

      const data: ApiResponse<ImportedRepository> = await response.json();

      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error importing repository:", error);
      return null;
    }
  },

  // Get imported repositories
  async getImportedRepositories(): Promise<ImportedRepository[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/github/repos/imported`,
        {
          headers,
        }
      );

      const data: ApiResponse<{
        repositories: ImportedRepository[];
        total_count: number;
      }> = await response.json();
      return data.success && data.data ? data.data.repositories : [];
    } catch (error) {
      console.error("Error fetching imported repositories:", error);
      return [];
    }
  },
};
