"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { GitHubIcon, SearchIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { Notification } from "@/components/ui/notification";
import { githubApi, GitHubRepository } from "@/lib/api/github";

export default function ImportProjectPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [importedRepositories, setImportedRepositories] = useState<
    GitHubRepository[]
  >([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load GitHub data
  useEffect(() => {
    async function loadGitHubData() {
      try {
        setIsLoading(true);

        // Check GitHub App connection status
        const status = await githubApi.getStatus();
        const connected = status?.connected || false;
        setIsConnected(connected);

        if (connected) {
          setIsLoadingRepos(true);

          // Load repositories from GitHub App and imported repositories
          const [repositories, imported] = await Promise.all([
            githubApi.getRepositories(),
            githubApi.getImportedRepositories(),
          ]);
          setRepositories(repositories);
          setImportedRepositories(imported);
          setIsLoadingRepos(false);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading GitHub data:", error);
        setIsLoading(false);
        setIsLoadingRepos(false);
      }
    }

    if (user) {
      loadGitHubData();
    }
  }, [user]);

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

    // Show success notification and call connect endpoint if GitHub was just connected
    if (githubConnected === "true" && installationId) {
      setShowNotification(true);

      // Call connect endpoint to associate installation with user
      githubApi.connectInstallation(installationId).then((success) => {
        if (success) {
          console.log("Installation connected successfully");
          // Reload page to fetch repositories
          window.location.reload();
        } else {
          console.error("Failed to connect installation");
        }
      });

      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // Function to refresh imported repositories after successful import
  const handleImportSuccess = async () => {
    try {
      const imported = await githubApi.getImportedRepositories();
      setImportedRepositories(imported);
    } catch (error) {
      console.error("Error refreshing imported repositories:", error);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto">
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

        <h1 className="text-3xl font-bold text-white mb-4">
          Import Git Repository
        </h1>
        <p className="text-lg" style={{ color: "#A1A1A1" }}>
          Select repositories from your GitHub account to create new projects.
        </p>
      </div>

      {/* Main Content */}
      <div
        className="bg-black rounded-lg p-8"
        style={{ border: "1px solid #3D3D3D" }}
      >
        {isLoading ? (
          <LoadingSection />
        ) : !isConnected ? (
          <GitHubConnectSection />
        ) : (
          <GitHubRepositorySection
            repositories={filteredRepositories}
            importedRepositories={importedRepositories}
            isLoadingRepos={isLoadingRepos}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onImportSuccess={handleImportSuccess}
          />
        )}

        <div className="mt-12">
          <p style={{ color: "#A1A1A1" }} className="text-sm">
            Missing Git repository?{" "}
            <a href="#" className="text-blue-400 hover:text-blue-300">
              Adjust GitHub Permissions →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSection() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
      <h2 className="text-xl font-semibold text-white mb-4">
        Checking GitHub connection...
      </h2>
      <p className="mb-8 max-w-md mx-auto" style={{ color: "#A1A1A1" }}>
        Please wait while we verify your GitHub account connection.
      </p>
    </div>
  );
}

function GitHubConnectSection() {
  const handleConnectGitHub = async () => {
    try {
      const installUrl = githubApi.getInstallUrl();
      window.location.href = installUrl;
    } catch (error) {
      console.error("Error getting GitHub App install URL:", error);
    }
  };

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
        <GitHubIcon className="w-8 h-8" style={{ color: "#A1A1A1" }} />
      </div>
      <h2 className="text-xl font-semibold text-white mb-4">
        Connect your GitHub account
      </h2>
      <p className="mb-8 max-w-md mx-auto" style={{ color: "#A1A1A1" }}>
        To import repositories, you need to connect your GitHub account via our
        GitHub App.
      </p>

      <div className="max-w-sm mx-auto">
        <button
          onClick={handleConnectGitHub}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <GitHubIcon className="w-5 h-5" />
          Connect GitHub Account
        </button>
      </div>

      <div
        className="mt-6 text-sm max-w-lg mx-auto text-center"
        style={{ color: "#A1A1A1" }}
      >
        <p>
          You&apos;ll be redirected to GitHub to install the Sirpi app and
          authorize access to your repositories.
        </p>
      </div>
    </div>
  );
}

function GitHubRepositorySection({
  repositories,
  importedRepositories,
  isLoadingRepos,
  searchQuery,
  setSearchQuery,
  onImportSuccess,
}: {
  repositories: GitHubRepository[];
  importedRepositories: GitHubRepository[];
  isLoadingRepos: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onImportSuccess: () => void;
}) {
  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-6">
        <SearchIcon
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
          style={{ color: "#A1A1A1" }}
        />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-black rounded-lg text-white focus:outline-none transition-colors placeholder:text-[#A1A1A1]"
          style={{
            border: "1px solid #3D3D3D",
          }}
        />
      </div>

      {/* Repository List */}
      <div className="space-y-3">
        {isLoadingRepos ? (
          // Show loading skeleton while repositories are being fetched
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg animate-pulse"
              style={{ border: "1px solid #3D3D3D" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-800 rounded"></div>
                  <div>
                    <div className="h-4 bg-gray-800 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-48"></div>
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-800 rounded"></div>
              </div>
            </div>
          ))
        ) : repositories.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: "#A1A1A1" }}>
              No repositories found. Make sure your GitHub connection has access
              to your repositories.
            </p>
          </div>
        ) : (
          repositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              isImported={importedRepositories.some(
                (imported) => imported.id === repo.id
              )}
              onImportSuccess={onImportSuccess}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RepositoryCard({
  repository,
  isImported,
  onImportSuccess,
}: {
  repository: GitHubRepository;
  isImported: boolean;
  onImportSuccess: () => void;
}) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (isImported || isImporting) return;

    setIsImporting(true);
    try {
      const success = await githubApi.importRepository(repository.full_name);
      if (success) {
        // Show success notification
        console.log(`Successfully imported ${repository.full_name}`);

        // Call the success callback to refresh the imported repositories list
        onImportSuccess();

        // Navigate to the project configuration page
        const encodedRepoName = encodeURIComponent(repository.full_name);
        router.push(`/projects/import/${encodedRepoName}`);
      } else {
        console.error(`Failed to import ${repository.full_name}`);
        alert(
          "Repository Import Failed\nFailed to import repository. Please try again."
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      alert(
        "Repository Import Failed\nFailed to import repository. Please try again."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      className="p-4 rounded-lg transition-colors"
      style={{
        border: isImported ? "1px solid #22c55e" : "1px solid #3D3D3D",
        backgroundColor: isImported ? "rgba(34, 197, 94, 0.05)" : "transparent",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {repository.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium">{repository.name}</h3>
              {repository.private && (
                <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">
                  Private
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              {repository.description && (
                <p className="text-sm" style={{ color: "#A1A1A1" }}>
                  {repository.description}
                </p>
              )}
            </div>
            <div
              className="flex items-center gap-4 mt-2 text-xs"
              style={{ color: "#A1A1A1" }}
            >
              {repository.language && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  {repository.language}
                </span>
              )}
              <span>Updated {formatDate(repository.updated_at)}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleImport}
          disabled={isImported || isImporting}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            isImported
              ? "bg-green-500/20 text-green-400 cursor-not-allowed"
              : isImporting
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
              <span>Importing...</span>
            </>
          ) : isImported ? (
            "Imported"
          ) : (
            "Import"
          )}
        </button>
      </div>
    </div>
  );
}
