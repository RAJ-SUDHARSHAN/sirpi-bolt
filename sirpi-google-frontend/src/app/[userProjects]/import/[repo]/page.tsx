"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon, GitHubIcon } from "@/components/ui/icons";
import { githubApi, GitHubRepository } from "@/lib/api/github";
import { getUserProjectNamespace, projectsApi } from "@/lib/api/projects";

export default function ConfigureProjectPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const userProjects = params.userProjects as string;
  const repoParam = params.repo as string;
  const repoFullName = decodeURIComponent(repoParam);

  const [repository, setRepository] = useState<GitHubRepository | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [envVars, setEnvVars] = useState<
    Array<{ key: string; value: string; isSecret: boolean }>
  >([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Validate user namespace
  useEffect(() => {
    if (user) {
      const expectedNamespace = getUserProjectNamespace(user);
      if (userProjects !== expectedNamespace) {
        router.replace(`/${expectedNamespace}/import/${repoParam}`);
        return;
      }
    }
  }, [user, userProjects, repoParam, router]);

  // Load repository details
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
          // Repository not found, redirect back
          router.push(`/${userProjects}/import`);
        }
      } catch (error) {
        console.error("Error loading repository:", error);
        router.push(`/${userProjects}/import`);
      } finally {
        setIsLoading(false);
      }
    }

    if (user && repoFullName) {
      loadRepository();
    }
  }, [user, repoFullName, userProjects, router]);

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: "", value: "", isSecret: true }]);
  };

  const updateEnvVar = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleDeploy = async () => {
    if (!repository) return;

    try {
      setIsDeploying(true);

      // First, import the repository to get the repository ID
      const importResult = await githubApi.importRepository(
        repository.full_name
      );

      if (importResult && importResult.id) {
        // Filter out empty environment variables
        const validEnvVars = envVars.filter(
          (env) => env.key.trim() !== "" && env.value.trim() !== ""
        );

        console.log("Creating project with name:", projectName);

        // Create the project with configuration
        const projectResult = await projectsApi.createProject({
          repository_id: importResult.id,
          project_name: projectName,
          framework: framework,
          environment_variables: validEnvVars.map((env) => ({
            key: env.key,
            value: env.value,
          })),
        });

        console.log("Project creation result:", projectResult);

        if (projectResult) {
          // Redirect to projects with success message
          router.push(
            `/${userProjects}?created=true&project=${encodeURIComponent(
              projectName
            )}`
          );
        } else {
          console.error("Project creation failed - no result returned");
          // Handle error appropriately
        }
      } else {
        console.error("Repository import failed");
        // Handle error appropriately
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Repository Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            The repository you&apos;re trying to configure doesn&apos;t exist or
            you don&apos;t have access to it.
          </p>
          <button
            onClick={() => router.push(`/${userProjects}/import`)}
            className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Back to Import
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/${userProjects}/import`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Import
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">
          Configure Project
        </h1>
        <p className="text-gray-400">
          Configure your project settings before deployment.
        </p>
      </div>

      {/* Repository Info */}
      <div
        className="bg-black rounded-lg p-6 mb-8"
        style={{ border: "1px solid #3D3D3D" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <GitHubIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {repository.name}
            </h2>
            <p className="text-sm text-gray-400">{repository.full_name}</p>
            {repository.description && (
              <p className="text-sm text-gray-500 mt-1">
                {repository.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Settings */}
          <div
            className="bg-black rounded-lg p-6"
            style={{ border: "1px solid #3D3D3D" }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Project Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-black rounded-lg text-white focus:outline-none transition-colors"
                  style={{ border: "1px solid #3D3D3D" }}
                  placeholder="my-awesome-project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Framework Preset
                </label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full px-3 py-2 bg-black rounded-lg text-white focus:outline-none transition-colors"
                  style={{ border: "1px solid #3D3D3D" }}
                >
                  <option value="nextjs">Next.js</option>
                  <option value="react">React</option>
                  <option value="vue">Vue.js</option>
                  <option value="nuxt">Nuxt.js</option>
                  <option value="svelte">SvelteKit</option>
                  <option value="static">Static HTML</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div
            className="bg-black rounded-lg p-6"
            style={{ border: "1px solid #3D3D3D" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Environment Variables
              </h3>
              <button
                onClick={addEnvVar}
                className="px-3 py-1 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Add Variable
              </button>
            </div>

            {envVars.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No environment variables configured. Add variables that your
                application needs.
              </p>
            ) : (
              <div className="space-y-3">
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={envVar.key}
                      onChange={(e) =>
                        updateEnvVar(index, "key", e.target.value)
                      }
                      placeholder="VARIABLE_NAME"
                      className="flex-1 px-3 py-2 bg-black rounded-lg text-white focus:outline-none transition-colors"
                      style={{ border: "1px solid #3D3D3D" }}
                    />
                    <input
                      type={envVar.isSecret ? "password" : "text"}
                      value={envVar.value}
                      onChange={(e) =>
                        updateEnvVar(index, "value", e.target.value)
                      }
                      placeholder="value"
                      className="flex-1 px-3 py-2 bg-black rounded-lg text-white focus:outline-none transition-colors"
                      style={{ border: "1px solid #3D3D3D" }}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={envVar.isSecret}
                        onChange={(e) =>
                          updateEnvVar(index, "isSecret", e.target.checked)
                        }
                        className="rounded"
                      />
                      Secret
                    </label>
                    <button
                      onClick={() => removeEnvVar(index)}
                      className="px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deploy Button */}
          <div
            className="bg-black rounded-lg p-6"
            style={{ border: "1px solid #3D3D3D" }}
          >
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !projectName.trim()}
              className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeploying ? "Deploying..." : "Deploy"}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Your project will be deployed and available at a unique URL.
            </p>
          </div>

          {/* Repository Details */}
          <div
            className="bg-black rounded-lg p-6"
            style={{ border: "1px solid #3D3D3D" }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Repository Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400">Language</p>
                <p className="text-white">
                  {repository.language || "Not detected"}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Default Branch</p>
                <p className="text-white">{repository.default_branch}</p>
              </div>
              <div>
                <p className="text-gray-400">Visibility</p>
                <p className="text-white">
                  {repository.private ? "Private" : "Public"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
