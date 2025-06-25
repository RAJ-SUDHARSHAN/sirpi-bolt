/**
 * API client for interacting with the Sirpi Google ADK backend
 */

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Type definitions for Google ADK API responses
export type Repository = {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  framework_info: FrameworkInfo | null;
  analysis_status: "pending" | "analyzing" | "completed" | "failed";
  analysis_cache: Record<string, any> | null;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
};

export type FrameworkInfo = {
  framework: string;
  display_name: string;
  icon: string;
  version?: string;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  repository_id: string;
  repository_name: string | null;
  framework_info: FrameworkInfo | null;
  current_agent: string | null;
  workflow_phase: string;
  agent_coordination_data: Record<string, any> | null;
  infrastructure_config: Record<string, any> | null;
  deployment_config: Record<string, any> | null;
  status:
    | "initializing"
    | "analyzing"
    | "planning"
    | "ready_to_deploy"
    | "deploying"
    | "deployed"
    | "failed";
  created_at: string;
  updated_at: string;
};

export type AgentSession = {
  id: string;
  project_id: string;
  vertex_session_id: string;
  agent_type:
    | "infrastructure_analyzer"
    | "deployment_planner"
    | "code_generator"
    | "deployment_orchestrator";
  status: "active" | "completed" | "failed";
  context_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type DeploymentTemplate = {
  id: string;
  name: string;
  description: string | null;
  cloud_provider: "aws" | "gcp" | "azure";
  template_type: "container" | "serverless" | "static" | "database";
  config_schema: Record<string, any>;
  is_active: boolean;
  created_at: string;
};

export type CloudResource = {
  id: string;
  project_id: string;
  resource_type: string;
  resource_id: string;
  resource_name: string | null;
  cloud_provider: "aws" | "gcp" | "azure";
  region: string | null;
  status:
    | "creating"
    | "active"
    | "updating"
    | "deleting"
    | "deleted"
    | "failed";
  configuration: Record<string, any> | null;
  metadata: Record<string, any> | null;
  cost_estimate: number | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedFile = {
  id: string;
  project_id: string;
  file_path: string;
  file_content: string;
  file_type: "terraform" | "dockerfile" | "config" | "script";
  version: number;
  is_active: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
};

/**
 * Makes an authenticated request to the Sirpi Google ADK API
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get Clerk token for authentication
  let token: string | null = null;
  if (typeof window !== "undefined" && window.Clerk?.session) {
    token = await window.Clerk.session.getToken();
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage =
        errorJson.message || errorJson.error || "An error occurred";
    } catch {
      errorMessage = errorText || `HTTP error ${response.status}`;
    }

    throw new ApiError(errorMessage, response.status);
  }

  // Return empty object for 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * API client for Sirpi Google ADK
 */
export const api = {
  // GitHub repositories
  repositories: {
    list: () => fetchApi<Repository[]>("/api/repositories"),
    get: (repoId: string) =>
      fetchApi<Repository>(`/api/repositories/${repoId}`),
    connect: (repoId: string) =>
      fetchApi<{ success: boolean }>(`/api/repositories/${repoId}/connect`, {
        method: "POST",
      }),
    analyze: (repoId: string) =>
      fetchApi<{ success: boolean }>(`/api/repositories/${repoId}/analyze`, {
        method: "POST",
      }),
  },

  // Projects with multi-agent workflows
  projects: {
    list: () => fetchApi<Project[]>("/api/projects"),
    get: (projectId: string) => fetchApi<Project>(`/api/projects/${projectId}`),
    create: (data: {
      name: string;
      description?: string;
      repository_id: string;
      template_id?: string;
    }) =>
      fetchApi<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    startWorkflow: (projectId: string) =>
      fetchApi<{ success: boolean }>(
        `/api/projects/${projectId}/workflow/start`,
        {
          method: "POST",
        }
      ),
    getGeneratedFiles: (projectId: string) =>
      fetchApi<GeneratedFile[]>(`/api/projects/${projectId}/files`),
  },

  // Agent sessions
  agents: {
    getSessions: (projectId: string) =>
      fetchApi<AgentSession[]>(`/api/projects/${projectId}/agents/sessions`),
    createSession: (projectId: string, agentType: AgentSession["agent_type"]) =>
      fetchApi<AgentSession>(`/api/projects/${projectId}/agents/sessions`, {
        method: "POST",
        body: JSON.stringify({ agent_type: agentType }),
      }),
    getEvents: (sessionId: string) =>
      fetchApi<any[]>(`/api/agents/sessions/${sessionId}/events`),
  },

  // Deployment templates
  templates: {
    list: () => fetchApi<DeploymentTemplate[]>("/api/templates"),
    get: (templateId: string) =>
      fetchApi<DeploymentTemplate>(`/api/templates/${templateId}`),
  },

  // Cloud resources
  resources: {
    list: (projectId: string) =>
      fetchApi<CloudResource[]>(`/api/projects/${projectId}/resources`),
    get: (resourceId: string) =>
      fetchApi<CloudResource>(`/api/resources/${resourceId}`),
  },

  // Deployment operations
  deployment: {
    validateCredentials: (credentials: {
      gcp_project_id: string;
      gcp_service_account_key: string;
      gcp_region?: string;
    }) =>
      fetchApi<{ success: boolean }>("/api/deployment/validate-credentials", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    getStatus: (projectId: string) =>
      fetchApi<{
        status: string;
        endpoints?: Record<string, string>;
        resources?: CloudResource[];
      }>(`/api/deployment/projects/${projectId}/status`),

    plan: (projectId: string, credentials: any) =>
      fetchApi<{ operation_id: string }>(
        `/api/deployment/projects/${projectId}/plan`,
        {
          method: "POST",
          body: JSON.stringify({ credentials }),
        }
      ),

    apply: (projectId: string, credentials: any) =>
      fetchApi<{ operation_id: string }>(
        `/api/deployment/projects/${projectId}/apply`,
        {
          method: "POST",
          body: JSON.stringify({ credentials }),
        }
      ),

    destroy: (projectId: string, credentials: any) =>
      fetchApi<{ operation_id: string }>(
        `/api/deployment/projects/${projectId}/destroy`,
        {
          method: "POST",
          body: JSON.stringify({ credentials }),
        }
      ),
  },
};
