"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  GitHubIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { githubApi, GitHubRepository } from "@/lib/api/github";
import { projectsApi, getUserProjectNamespace } from "@/lib/api/projects";
import { Notification } from "@/components/ui/notification";

interface FrameworkOption {
  id: string;
  name: string;
  icon: string;
}

interface EnvironmentVariable {
  key: string;
  value: string;
}

export default function ProjectConfigPage() {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const repoFullName = decodeURIComponent(params.repo as string);

  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("other");
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [environmentVars, setEnvironmentVars] = useState<EnvironmentVariable[]>(
    [{ key: "", value: "" }]
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const frameworks: FrameworkOption[] = [
    { id: "nextjs", name: "Next.js", icon: "⚡" },
    { id: "react", name: "React", icon: "⚛️" },
    { id: "vue", name: "Vue.js", icon: "💚" },
    { id: "angular", name: "Angular", icon: "🅰️" },
    { id: "svelte", name: "Svelte", icon: "🧡" },
    { id: "nuxt", name: "Nuxt.js", icon: "💚" },
    { id: "gatsby", name: "Gatsby", icon: "🟣" },
    { id: "vite", name: "Vite", icon: "⚡" },
    { id: "other", name: "Other", icon: "⚙️" },
  ];

  useEffect(() => {
    async function loadRepository() {
      try {
        setIsLoading(true);
        const repos = await githubApi.getRepositories();
        const repo = repos.find((r) => r.full_name === repoFullName);

        if (repo) {
          setRepository(repo);
          setProjectName(repo.name);
        } else {
          router.push("/projects/import");
        }
      } catch (error) {
        console.error("Error loading repository:", error);
        router.push("/projects/import");
      } finally {
        setIsLoading(false);
      }
    }

    if (user && repoFullName) {
      loadRepository();
    }
  }, [user, repoFullName, router]);

  const handleAddEnvVar = () => {
    setEnvironmentVars([...environmentVars, { key: "", value: "" }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvironmentVars(environmentVars.filter((_, i) => i !== index));
  };

  const handleEnvVarChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...environmentVars];
    updated[index][field] = value;
    setEnvironmentVars(updated);
  };

  const handleDeploy = async () => {
    if (!repository || isDeploying) return; // Prevent multiple submissions

    try {
      setIsDeploying(true);

      // First, import the repository to get the repository ID
      const importResult = await githubApi.importRepository(
        repository.full_name
      );

      if (importResult && importResult.id) {
        console.log("Creating project with name:", projectName);

        // Create the project with configuration
        const projectResult = await projectsApi.createProject({
          repository_id: importResult.id,
          project_name: projectName,
          description: `Project created from ${repository.full_name}`,
          template_id: "gcp-cloud-run",
        });

        console.log("Project creation result:", projectResult);

        if (projectResult) {
          // Show success notification
          setNotification({
            show: true,
            type: "success",
            title: "Project Created Successfully",
            message: `${projectName} has been created and configured.`,
          });

          // Redirect to project detail page with correct user namespace
          console.log("Redirecting to project detail page...");
          setTimeout(() => {
            // Get the user namespace and use project slug for the URL
            const userNamespace = getUserProjectNamespace({
              firstName: user?.firstName,
              first_name: user?.firstName,
              emailAddresses: user?.emailAddresses,
            });
            const projectSlug =
              projectResult.slug ||
              projectName.toLowerCase().replace(/[^a-z0-9]/g, "-");
            router.push(`/${userNamespace}/${projectSlug}`);
          }, 1500); // Give time for notification to show
        } else {
          console.error("Project creation failed - no result returned");
          setNotification({
            show: true,
            type: "error",
            title: "Project Creation Failed",
            message: "Failed to create project. Please try again.",
          });
        }
      } else {
        console.error("Repository import failed");
        setNotification({
          show: true,
          type: "error",
          title: "Repository Import Failed",
          message: "Failed to import repository. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setNotification({
        show: true,
        type: "error",
        title: "An Error Occurred",
        message:
          "An error occurred while creating the project. Please try again.",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!repository) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notification */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        show={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/projects/import")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Import
        </button>

        <h1 className="text-3xl font-bold text-white mb-4">New Project</h1>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Repository Info */}
        <div
          className="bg-[#1a1a1a] rounded-lg p-4"
          style={{ border: "1px solid #3D3D3D" }}
        >
          <div className="text-sm text-gray-400 mb-2">
            Importing from GitHub
          </div>
          <div className="flex items-center gap-3">
            <GitHubIcon className="w-5 h-5 text-white" />
            <span className="text-white font-medium">
              {repository.full_name}
            </span>
            <div className="flex items-center gap-1 text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{repository.default_branch}</span>
            </div>
          </div>
        </div>

        {/* Project Configuration */}
        <div
          className="bg-black rounded-lg p-8"
          style={{ border: "1px solid #3D3D3D" }}
        >
          <div className="mb-8">
            <p className="text-white text-lg mb-6">
              Choose where you want to create the project and give it a name.
            </p>

            {/* Project Name */}
            <div className="mb-8">
              <label className="block text-gray-400 text-sm mb-3">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 bg-black rounded-lg text-white focus:outline-none transition-colors"
                style={{ border: "1px solid #3D3D3D" }}
              />
            </div>

            {/* Framework Preset */}
            <div className="mb-8">
              <label className="block text-gray-400 text-sm mb-3">
                Framework Preset
              </label>
              <div className="relative">
                <select
                  value={selectedFramework}
                  onChange={(e) => setSelectedFramework(e.target.value)}
                  className="w-full appearance-none px-4 py-3 bg-black rounded-lg text-white focus:outline-none transition-colors cursor-pointer"
                  style={{ border: "1px solid #3D3D3D" }}
                >
                  {frameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.icon} {framework.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Environment Variables */}
            <div>
              <button
                onClick={() => setShowEnvVars(!showEnvVars)}
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors mb-4"
              >
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${
                    showEnvVars ? "rotate-180" : ""
                  }`}
                />
                <span>Environment Variables</span>
              </button>

              {showEnvVars && (
                <div className="space-y-4">
                  {environmentVars.map((envVar, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 text-xs mb-1">
                            Key
                          </label>
                          <input
                            type="text"
                            value={envVar.key}
                            onChange={(e) =>
                              handleEnvVarChange(index, "key", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-black rounded text-white text-sm focus:outline-none"
                            style={{ border: "1px solid #3D3D3D" }}
                            placeholder="EXAMPLE_ENV_VAR"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <label className="text-gray-400 text-xs">
                              Value
                            </label>
                            <span className="text-xs text-gray-500">ⓘ</span>
                          </div>
                          <input
                            type="text"
                            value={envVar.value}
                            onChange={(e) =>
                              handleEnvVarChange(index, "value", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-black rounded text-white text-sm focus:outline-none"
                            style={{ border: "1px solid #3D3D3D" }}
                            placeholder="your-env-secret"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveEnvVar(index)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleAddEnvVar}
                    className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add More</span>
                  </button>

                  {/* <div
                    className="mt-4 p-3 rounded"
                    style={{ backgroundColor: "#1a1a1a" }}
                  >
                    <p className="text-gray-400 text-sm">
                      <span className="font-medium">Tip:</span> Paste an .env
                      above to populate the form.{" "}
                      <a href="#" className="text-blue-400 hover:text-blue-300">
                        Learn more ↗
                      </a>
                    </p>
                  </div> */}
                </div>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleDeploy}
            disabled={isDeploying || !projectName.trim()}
            className={`w-full py-3 rounded-lg font-medium transition-colors cursor-pointer ${
              isDeploying || !projectName.trim()
                ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {isDeploying ? "Creating..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
