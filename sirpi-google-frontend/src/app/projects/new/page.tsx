"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GitHubIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@/components/ui/icons";
import { Notification } from "@/components/ui/notification";
import {
  githubApi,
  GitHubRepository,
  ImportedRepository,
} from "@/lib/api/github";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  provider: string;
}

export default function NewProjectPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [importedRepositories, setImportedRepositories] = useState<
    ImportedRepository[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInstallation, setHasInstallation] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("AWS");

  // Check if this page was reached via GitHub installation callback
  useEffect(() => {
    const installationId = searchParams.get("installation_id");
    const state = searchParams.get("state");
    const setupAction = searchParams.get("setup_action");
    const githubConnected = searchParams.get("github_connected");

    // Handle GitHub installation callback redirect
    if (installationId && state && setupAction === "install") {
      console.log(
        "GitHub installation callback detected, redirecting to backend callback"
      );
      const callbackUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/github/callback?installation_id=${installationId}&state=${state}&setup_action=${setupAction}`;
      window.location.href = callbackUrl;
      return;
    }

    // Show success notification if GitHub was just connected
    if (githubConnected === "true") {
      setShowNotification(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Load GitHub data
  useEffect(() => {
    async function loadGitHubData() {
      try {
        setIsLoading(true);
        const installation = await githubApi.getInstallation();
        const hasValidInstallation = !!installation;
        setHasInstallation(hasValidInstallation);

        if (hasValidInstallation) {
          const [reposFromGitHub, importedRepos] = await Promise.all([
            githubApi.getRepositories(),
            githubApi.getImportedRepositories(),
          ]);
          setRepositories(reposFromGitHub);
          setImportedRepositories(importedRepos);
        }
      } catch (error) {
        console.error("Error loading GitHub data:", error);
        setHasInstallation(false);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadGitHubData();
    }
  }, [user]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const filteredRepositories = repositories.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const templates = [
    {
      id: "ecs-fargate",
      name: "ECS Fargate",
      description: "Serverless container deployment with AWS ECS Fargate.",
      icon: "🚀",
      provider: "AWS",
    },
    {
      id: "lambda-api",
      name: "Lambda API",
      description: "Serverless REST API with AWS Lambda and API Gateway.",
      icon: "⚡",
      provider: "AWS",
    },
    {
      id: "ec2-autoscaling",
      name: "EC2 Auto Scaling",
      description: "Auto-scaling web application on AWS EC2 instances.",
      icon: "📈",
      provider: "AWS",
    },
    {
      id: "rds-postgres",
      name: "RDS PostgreSQL",
      description: "Managed PostgreSQL database with AWS RDS.",
      icon: "🗄️",
      provider: "AWS",
    },
    {
      id: "cloud-run",
      name: "Cloud Run",
      description: "Serverless containers on Google Cloud Platform.",
      icon: "☁️",
      provider: "GCP",
    },
    {
      id: "app-engine",
      name: "App Engine",
      description: "Fully managed platform on Google Cloud.",
      icon: "🏗️",
      provider: "GCP",
    },
  ];

  const filteredTemplates =
    selectedProvider === "All"
      ? templates
      : templates.filter((template) => template.provider === selectedProvider);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Success Notification */}
      {showNotification && (
        <Notification
          type="success"
          title="GitHub Connected Successfully"
          message="You can now import repositories from your GitHub account."
          show={showNotification}
          onClose={() => setShowNotification(false)}
        />
      )}

      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/projects")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 cursor-pointer"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Let&apos;s automate your infrastructure.
          </h1>
          <p className="text-lg" style={{ color: "#A1A1A1" }}>
            To deploy a new project, import an existing Git repository or get
            started with one of our infrastructure templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Card - Import Git Repository */}
        <div
          className="bg-black rounded-lg p-8"
          style={{ border: "1px solid #3D3D3D" }}
        >
          <h1 className="text-2xl font-semibold text-white mb-8">
            Import Git Repository
          </h1>

          {!hasInstallation ? (
            <GitHubConnectSection />
          ) : (
            <GitHubRepositorySection
              repositories={filteredRepositories}
              importedRepositories={importedRepositories}
              isLoading={isLoading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          <div className="mt-12">
            <p style={{ color: "#A1A1A1" }} className="text-sm">
              Missing Git repository?{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300">
                Adjust GitHub App Permissions →
              </a>
            </p>
          </div>
        </div>

        {/* Right Card - Clone Template */}
        <div
          className="bg-black rounded-lg p-8"
          style={{ border: "1px solid #3D3D3D" }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">
              Clone Template
            </h1>
            <div className="relative">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="appearance-none bg-black rounded-lg px-3 py-2 pr-8 text-white text-sm focus:outline-none transition-colors cursor-pointer"
                style={{ border: "1px solid #3D3D3D" }}
              >
                <option value="AWS">AWS</option>
                <option value="GCP">GCP (Coming Soon)</option>
                <option value="Azure">Azure (Coming Soon)</option>
                <option value="DigitalOcean">DigitalOcean (Coming Soon)</option>
              </select>
              <ChevronDownIcon
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "#A1A1A1" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>

          <div className="mt-12">
            <p style={{ color: "#A1A1A1" }} className="text-sm">
              Browse All Templates →
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GitHubConnectSection() {
  const router = useRouter();
  const { user } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleConnect = async () => {
    try {
      const authUrl = githubApi.getAuthUrl();
      router.push(authUrl);
    } catch (error) {
      console.error("Error getting GitHub auth URL:", error);
    }
  };

  const displayName =
    user?.username ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";

  return (
    <div className="space-y-4">
      {/* GitHub Username Dropdown + Search Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <div
            className="flex items-center gap-3 p-3 bg-black rounded-lg cursor-pointer hover:bg-[#1A1A1A] transition-colors"
            style={{ border: "1px solid #3D3D3D" }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <GitHubIcon
              className="w-5 h-5 flex-shrink-0"
              style={{ color: "#A1A1A1" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {displayName.toUpperCase()}
              </div>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              style={{ color: "#A1A1A1" }}
            />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-black rounded-lg shadow-lg z-10"
              style={{ border: "1px solid #3D3D3D" }}
            >
              <div className="p-3">
                <div className="text-sm font-medium text-white mb-1">
                  {displayName}
                </div>
                <div className="text-xs" style={{ color: "#A1A1A1" }}>
                  {user?.emailAddresses[0]?.emailAddress}
                </div>
              </div>
              <div className="border-t" style={{ borderColor: "#3D3D3D" }}>
                <button
                  onClick={handleConnect}
                  className="w-full text-left p-3 text-sm text-white hover:bg-[#1A1A1A] transition-colors"
                >
                  Connect GitHub Account
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: "#A1A1A1" }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 bg-black rounded-lg text-white focus:outline-none transition-colors placeholder:text-[#A1A1A1]"
            style={{ border: "1px solid #3D3D3D" }}
            disabled
          />
        </div>
      </div>

      <div className="text-center py-8">
        <p className="text-sm mb-4" style={{ color: "#A1A1A1" }}>
          Connect your GitHub account to import repositories
        </p>
        <button
          onClick={handleConnect}
          className="px-6 py-3 text-sm font-medium rounded-md transition-colors cursor-pointer"
          style={{
            border: "1px solid #FFFFFF",
            backgroundColor: "transparent",
            color: "#FFFFFF",
          }}
        >
          Connect GitHub
        </button>
      </div>
    </div>
  );
}

function GitHubRepositorySection({
  repositories,
  importedRepositories,
  isLoading,
  searchQuery,
  setSearchQuery,
}: {
  repositories: GitHubRepository[];
  importedRepositories: ImportedRepository[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const { user } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayName =
    user?.username ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";

  return (
    <div className="space-y-4">
      {/* GitHub Username Dropdown + Search Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <div
            className="flex items-center gap-3 p-3 bg-black rounded-lg cursor-pointer hover:bg-[#1A1A1A] transition-colors"
            style={{ border: "1px solid #3D3D3D" }}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <GitHubIcon
              className="w-5 h-5 flex-shrink-0"
              style={{ color: "#A1A1A1" }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {displayName.toUpperCase()}
              </div>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              style={{ color: "#A1A1A1" }}
            />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-black rounded-lg shadow-lg z-10"
              style={{ border: "1px solid #3D3D3D" }}
            >
              <div className="p-3">
                <div className="text-sm font-medium text-white mb-1">
                  {displayName}
                </div>
                <div className="text-xs" style={{ color: "#A1A1A1" }}>
                  {user?.emailAddresses[0]?.emailAddress}
                </div>
              </div>
              <div className="border-t" style={{ borderColor: "#3D3D3D" }}>
                <div className="p-3">
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "#22c55e" }}
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Connected
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: "#A1A1A1" }}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black rounded-lg text-white focus:outline-none transition-colors placeholder:text-[#A1A1A1]"
            style={{ border: "1px solid #3D3D3D" }}
          />
        </div>
      </div>

      {/* Repository List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-black rounded-lg animate-pulse"
                style={{ border: "1px solid #3D3D3D" }}
              >
                <div className="h-4 bg-gray-800 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <div className="p-4 text-center" style={{ color: "#A1A1A1" }}>
            No repositories found
          </div>
        ) : (
          repositories.map((repo) => {
            const isImported = importedRepositories.some(
              (imported) => imported.full_name === repo.full_name
            );
            return (
              <RepositoryCard
                key={repo.id}
                repository={repo}
                isImported={isImported}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function RepositoryCard({
  repository,
  isImported,
}: {
  repository: GitHubRepository;
  isImported: boolean;
}) {
  const router = useRouter();

  const handleImport = async () => {
    if (isImported) return;

    // Navigate to configuration page instead of directly importing
    const encodedRepoName = encodeURIComponent(repository.full_name);
    router.push(`/projects/import/${encodedRepoName}`);
  };

  return (
    <div
      className="flex items-center justify-between p-4 bg-black rounded-lg hover:bg-[#1A1A1A] transition-colors"
      style={{ border: "1px solid #3D3D3D" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-white">
            {repository.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium text-white">
            {repository.name}
          </div>
          <div className="text-xs" style={{ color: "#A1A1A1" }}>
            {new Date(repository.updated_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <button
        onClick={handleImport}
        disabled={isImported}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
          isImported ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{
          border: "1px solid #FFFFFF",
          backgroundColor: "transparent",
          color: "#FFFFFF",
        }}
      >
        {isImported ? "Imported" : "Import"}
      </button>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const isComingSoon = template.provider !== "AWS";

  return (
    <div
      className={`p-6 bg-black rounded-lg transition-colors ${
        isComingSoon
          ? "opacity-60 cursor-not-allowed"
          : "hover:bg-[#1A1A1A] cursor-pointer"
      }`}
      style={{ border: "1px solid #3D3D3D" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
          <span className="text-xl">{template.icon}</span>
        </div>
        <div className="text-sm font-medium text-white">{template.name}</div>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#A1A1A1" }}>
        {template.description}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="text-xs px-2 py-1 bg-gray-800 rounded"
          style={{ color: "#A1A1A1" }}
        >
          {template.provider}
        </span>
        {isComingSoon && (
          <span
            className="text-xs px-2 py-1 bg-yellow-900/30 rounded"
            style={{ color: "#FCD34D" }}
          >
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}
