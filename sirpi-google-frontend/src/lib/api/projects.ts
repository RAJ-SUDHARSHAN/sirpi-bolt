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

// Types for Google ADK Projects API responses
export interface FrameworkInfo {
  framework: string;
  display_name: string;
  icon: string;
  version?: string;
}

export interface CloudResource {
  id: string;
  resource_type: string;
  resource_name: string | null;
  cloud_provider: "aws" | "gcp" | "azure";
  status:
    | "creating"
    | "active"
    | "updating"
    | "deleting"
    | "deleted"
    | "failed";
  metadata: Record<string, unknown> | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  repository_id: string;
  repository_name: string | null;
  framework_info: FrameworkInfo | null;
  current_agent: string | null;
  workflow_phase: string;
  agent_coordination_data: Record<string, unknown> | null;
  infrastructure_config: Record<string, unknown> | null;
  deployment_config: Record<string, unknown> | null;
  status:
    | "initializing"
    | "analyzing"
    | "planning"
    | "ready_to_deploy"
    | "deploying"
    | "deployed"
    | "failed";
  resources: CloudResource[];
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  framework_info: FrameworkInfo | null;
  analysis_status: "pending" | "analyzing" | "completed" | "failed";
  is_connected: boolean;
}

export interface UserOverview {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
    github_username: string | null;
    github_avatar_url: string | null;
    gcp_project_id: string | null;
    gcp_region: string | null;
  };
  github: {
    connected: boolean;
    username: string | null;
    avatar_url: string | null;
    installation_id: string | null;
  };
  repositories: {
    count: number;
    items: Repository[];
  };
  projects: {
    count: number;
    items: Project[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  data?: T;
  error?: string;
}

// Helper function to generate user project namespace
export const getUserProjectNamespace = (
  user: {
    firstName?: string | null;
    first_name?: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
  } | null
): string => {
  if (!user) return "user-projects";

  // Try to use first name if available
  const firstName = user.firstName || user.first_name;
  if (firstName) {
    return `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-projects`;
  }

  // Fallback to email username
  if (user.emailAddresses?.[0]?.emailAddress) {
    const emailUsername = user.emailAddresses[0].emailAddress.split("@")[0];
    return `${emailUsername.toLowerCase().replace(/[^a-z0-9]/g, "")}-projects`;
  }

  return "user-projects";
};

// Projects API client for Google ADK
export const projectsApi = {
  // Get user overview including projects
  async getUserOverview(): Promise<UserOverview | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/users/me/overview`, {
        headers,
      });

      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();

      // Check if this is a direct UserOverview response or wrapped in ApiResponse
      if (
        data &&
        typeof data === "object" &&
        "user" in data &&
        "projects" in data
      ) {
        // Direct response - return as is
        return data as UserOverview;
      } else if (data && data.success && data.data) {
        // Wrapped in ApiResponse - extract data
        return data.data as UserOverview;
      } else {
        console.error("API returned unexpected format:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user overview:", error);
      return null;
    }
  },

  // Create/configure a new project with multi-agent workflow
  async createProject(config: {
    repository_id: string;
    project_name: string;
    description?: string;
    template_id?: string;
  }): Promise<Project | null> {
    try {
      const headers = await getAuthHeaders();
      console.log("Creating project with config:", config);

      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: config.project_name,
          description: config.description,
          repository_id: config.repository_id,
          template_id: config.template_id || "gcp-cloud-run", // Default to GCP Cloud Run template
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data && data.success && data.data) {
        return data.data;
      } else if (data && data.id) {
        // Direct project response
        return data as Project;
      } else {
        console.error("API returned unexpected format:", data);
        return null;
      }
    } catch (error) {
      console.error("Error creating project:", error);
      return null;
    }
  },

  // Start the multi-agent workflow for a project
  async startWorkflow(projectId: string): Promise<boolean> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/workflow/start`,
        {
          method: "POST",
          headers,
        }
      );

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error("Error starting workflow:", error);
      return false;
    }
  },

  // Get project details
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}`,
        {
          headers,
        }
      );

      const data: ApiResponse<Project> = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching project:", error);
      return null;
    }
  },

  // Get project generated files
  async getGeneratedFiles(projectId: string): Promise<Array<{
    id: string;
    file_path: string;
    file_content: string;
    file_type: "terraform" | "dockerfile" | "config" | "script";
    version: number;
  }> | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${projectId}/files`,
        {
          headers,
        }
      );

      const data = await response.json();
      return data.success && data.data ? data.data : null;
    } catch (error) {
      console.error("Error fetching generated files:", error);
      return null;
    }
  },
};
