"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  GitHubIcon,
  ExclamationCircleIcon,
  SearchIcon,
  ChevronDownIcon,
  PlusIcon,
  SparklesIcon,
  CloudIcon,
  RocketLaunchIcon,
} from "@/components/ui/icons";
import { githubApi, GitHubInstallation } from "@/lib/api/github";
import {
  projectsApi,
  Project,
  UserOverview,
  getUserProjectNamespace,
} from "@/lib/api/projects";

export default function UserProjectsPage() {
  const { user } = useUser();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const userProjects = params.userProjects as string;

  const [githubInstallation, setGithubInstallation] =
    useState<GitHubInstallation | null>(null);
  const [userOverview, setUserOverview] = useState<UserOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("activity");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Validate user namespace
  useEffect(() => {
    if (user && isClient) {
      const expectedNamespace = getUserProjectNamespace(user);
      if (userProjects !== expectedNamespace) {
        router.replace(`/${expectedNamespace}`);
        return;
      }
    }
  }, [user, userProjects, router, isClient]);

  // Check URL params for errors
  useEffect(() => {
    if (!isClient) return;

    const errorParam = searchParams.get("error");
    if (errorParam === "github_auth_failed") {
      setError("Failed to connect to GitHub. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }

    const importedParam = searchParams.get("imported");
    const createdParam = searchParams.get("created");
    const projectParam = searchParams.get("project");
    if (importedParam === "true") {
      const projectName = projectParam
        ? decodeURIComponent(projectParam)
        : "Project";
      console.log(`${projectName} imported successfully!`);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (createdParam === "true") {
      const projectName = projectParam
        ? decodeURIComponent(projectParam)
        : "Project";
      console.log(`${projectName} created successfully!`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, isClient]);

  // Fetch GitHub installation status and user overview
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [installation, overview] = await Promise.all([
          githubApi.getInstallation(),
          projectsApi.getUserOverview(),
        ]);
        setGithubInstallation(installation);
        setUserOverview(overview);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isClient) {
      fetchData();
    }
  }, [user, isClient]);

  // Filter and sort projects
  const filteredProjects =
    userOverview?.projects.items.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.repository_name &&
          project.repository_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
    ) || [];

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "created":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "updated":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "activity":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  const hasProjects = userOverview && userOverview.projects.count > 0;

  if (!user || isLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error message for GitHub connection */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="font-medium text-red-200">Connection Error</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header Section */}
      <div className="text-center py-8">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
          <SparklesIcon className="w-4 h-4 mr-2" />
          AI-Powered Infrastructure
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Your Projects Dashboard
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Transform your repositories into production-ready infrastructure with AI-powered analysis and deployment automation.
        </p>
      </div>

      {/* Search Bar + Sort + Add New Row */}
      <div className="flex items-center gap-4 px-60">
        <div className="flex-1 relative">
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: "#A1A1A1" }}
          />
          <input
            type="text"
            placeholder="Search repositories and projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-black rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-[#A1A1A1]"
            style={{
              border: "1px solid #3D3D3D",
              color: "#FFFFFF",
            }}
          />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-black rounded-lg px-3 py-3 pr-8 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
            style={{
              border: "1px solid #3D3D3D",
            }}
          >
            <option value="activity">Sort by activity</option>
            <option value="name">Sort by name</option>
            <option value="created">Sort by created</option>
            <option value="updated">Sort by updated</option>
          </select>
          <ChevronDownIcon
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#A1A1A1" }}
          />
        </div>

        <button
          onClick={() => router.push(`/${userProjects}/import`)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          Add New Project
        </button>
      </div>

      {/* Projects Grid or Empty State */}
      {hasProjects ? (
        <ProjectsGrid projects={sortedProjects} userNamespace={userProjects} />
      ) : (
        <EmptyState installation={githubInstallation} isLoading={isLoading} />
      )}
    </div>
  );
}

function ProjectsGrid({
  projects,
  userNamespace,
}: {
  projects: Project[];
  userNamespace: string;
}) {
  return (
    <div className="px-60">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            userNamespace={userNamespace}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  userNamespace,
}: {
  project: Project;
  userNamespace: string;
}) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "deployed":
        return "#22c55e";
      case "generating":
      case "pending":
      case "deploying":
        return "#f59e0b";
      case "failed":
        return "#ef4444";
      case "ready_to_deploy":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Ready";
      case "deployed":
        return "Deployed";
      case "generating":
        return "Building";
      case "pending":
        return "Pending";
      case "deploying":
        return "Deploying";
      case "failed":
        return "Failed";
      case "ready_to_deploy":
        return "Ready to Deploy";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const handleProjectClick = () => {
    if (project.slug) {
      router.push(`/${userNamespace}/${project.slug}`);
    } else {
      router.push(`/projects/${project.id}`);
    }
  };

  return (
    <div
      className="bg-black rounded-xl p-6 hover:border-gray-600 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105"
      style={{ border: "1px solid #3D3D3D" }}
      onClick={handleProjectClick}
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            {project.framework_info?.icon ? (
              <span className="text-lg">{project.framework_info.icon}</span>
            ) : (
              <CloudIcon className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base group-hover:text-blue-400 transition-colors">
              {project.name}
            </h3>
            {project.repository_name && (
              <p className="text-xs text-gray-400">{project.repository_name}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${getStatusColor(project.status)}20`,
            color: getStatusColor(project.status),
          }}
        >
          {getStatusText(project.status)}
        </div>
      </div>

      {/* Project Info */}
      <div className="space-y-3">
        {project.framework_info && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <p className="text-xs text-gray-400">
              {project.framework_info.display_name}
            </p>
          </div>
        )}

        {project.deployment_config?.url && (
          <div className="flex items-center gap-2">
            <RocketLaunchIcon className="w-3 h-3 text-green-400" />
            <p className="text-xs text-blue-400 truncate">
              {project.deployment_config.url as string}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Created {formatDate(project.created_at)}
          </p>
          <div className="flex items-center gap-1">
            <SparklesIcon className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-400">AI Generated</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  installation,
  isLoading,
}: {
  installation: GitHubInstallation | null;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Enhanced Empty State Icon */}
      <div className="w-24 h-24 mb-8 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center">
        <CloudIcon className="w-12 h-12 text-blue-400" />
      </div>

      {/* Title and Description */}
      <h2 className="text-2xl font-bold text-white mb-4">
        Deploy your first project with AI
      </h2>
      <p className="mb-12 max-w-md text-gray-400 text-lg">
        Connect your GitHub repository and let our AI analyze your codebase to generate production-ready infrastructure.
      </p>

      {/* Enhanced Import Project Card */}
      <div className="w-full max-w-md">
        <ImportProjectCard installation={installation} isLoading={isLoading} />
      </div>

      {/* Features Grid */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <FeatureHighlight
          icon={<SparklesIcon className="w-6 h-6" />}
          title="AI Analysis"
          description="Automatically detects frameworks and dependencies"
        />
        <FeatureHighlight
          icon={<CloudIcon className="w-6 h-6" />}
          title="Multi-Cloud"
          description="Deploy to AWS, GCP, or Azure with one click"
        />
        <FeatureHighlight
          icon={<RocketLaunchIcon className="w-6 h-6" />}
          title="Production Ready"
          description="Auto-scaling, monitoring, and security included"
        />
      </div>
    </div>
  );
}

function FeatureHighlight({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function ImportProjectCard({
  installation,
  isLoading,
}: {
  installation: GitHubInstallation | null;
  isLoading: boolean;
}) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div
        className="bg-black rounded-xl p-6 border border-gray-800"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-800 rounded-xl animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-800 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-800 rounded animate-pulse w-2/3"></div>
          </div>
          <div className="w-20 h-10 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const handleImportClick = async () => {
    if (!installation) {
      try {
        const installUrl = githubApi.getInstallUrl();
        window.location.href = installUrl;
      } catch (error) {
        console.error("Error getting GitHub install URL:", error);
      }
    } else {
      router.push("/projects/import");
    }
  };

  return (
    <div
      className="bg-black rounded-xl p-6 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
      style={{
        border: installation ? "1px solid #22c55e" : "1px solid #3D3D3D",
        backgroundColor: installation ? "rgba(34, 197, 94, 0.05)" : "black",
      }}
      onClick={handleImportClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: installation
                ? "rgba(34, 197, 94, 0.2)"
                : "rgba(59, 130, 246, 0.2)",
            }}
          >
            <GitHubIcon
              className="w-6 h-6"
              style={{
                color: installation ? "#22c55e" : "#3b82f6",
              }}
            />
          </div>
          <div className="text-left">
            <div className="text-base font-semibold text-white">
              {installation ? "Import Repository" : "Connect GitHub"}
            </div>
            <div className="text-sm text-gray-400">
              {installation
                ? "Choose repos to create projects from"
                : "Connect your GitHub account to get started"}
            </div>
          </div>
        </div>
        <button
          className="px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {installation ? "Import" : "Connect"}
        </button>
      </div>
    </div>
  );
}