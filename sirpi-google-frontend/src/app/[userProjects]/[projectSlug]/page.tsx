"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  GitHubIcon,
  PlayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CpuChipIcon,
  CloudIcon,
  RocketLaunchIcon,
  EyeIcon,
  CodeBracketIcon,
  ServerIcon,
  CogIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import {
  Project,
  getUserProjectNamespace,
  projectsApi,
} from "@/lib/api/projects";

export default function ProjectDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const userProjects = params.userProjects as string;
  const projectSlug = params.projectSlug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Validate user namespace and load project
  useEffect(() => {
    if (user) {
      const expectedNamespace = getUserProjectNamespace(user);
      if (userProjects !== expectedNamespace) {
        router.replace(`/${expectedNamespace}/${projectSlug}`);
        return;
      }
    }
  }, [user, userProjects, projectSlug, router]);

  // Load project details
  useEffect(() => {
    async function loadProject() {
      try {
        setIsLoading(true);
        const overview = await projectsApi.getUserOverview();
        if (overview) {
          const foundProject = overview.projects.items.find(
            (p) =>
              p.slug === projectSlug ||
              p.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === projectSlug
          );

          if (foundProject) {
            setProject(foundProject);
          } else {
            router.push(`/${userProjects}`);
          }
        }
      } catch (error) {
        console.error("Error loading project:", error);
        router.push(`/${userProjects}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (user && projectSlug && userProjects) {
      loadProject();
    }
  }, [user, projectSlug, userProjects, router]);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <button
            onClick={() => router.push(`/${userProjects}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Projects
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-400 mb-8">
              The requested project could not be found.
            </p>
            <button
              onClick={() => router.push(`/${userProjects}`)}
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "deployed":
      case "ready_to_deploy":
        return "text-green-400";
      case "generating":
      case "analyzing":
      case "planning":
      case "deploying":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "deployed":
      case "ready_to_deploy":
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case "generating":
      case "analyzing":
      case "planning":
      case "deploying":
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case "failed":
        return <ExclamationCircleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: EyeIcon },
    { id: "analysis", name: "AI Analysis", icon: CpuChipIcon },
    { id: "infrastructure", name: "Infrastructure", icon: CloudIcon },
    { id: "deployment", name: "Deployment", icon: RocketLaunchIcon },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${userProjects}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {project.framework_info?.icon ? (
                    <span className="text-2xl">{project.framework_info.icon}</span>
                  ) : (
                    <CloudIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <GitHubIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">{project.repository_name}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(project.status)}
                  <span className={`font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                {project.framework_info && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-400 text-sm">
                      {project.framework_info.display_name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {project.status === "ready_to_deploy" && (
                <button
                  onClick={() => router.push(`/${userProjects}/${projectSlug}/deploy`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                >
                  <RocketLaunchIcon className="w-5 h-5" />
                  Deploy Now
                </button>
              )}
              
              <button className="flex items-center gap-2 px-4 py-3 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors">
                <CogIcon className="w-5 h-5" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <OverviewTab project={project} />
          )}
          
          {activeTab === "analysis" && (
            <AnalysisTab project={project} />
          )}
          
          {activeTab === "infrastructure" && (
            <InfrastructureTab project={project} />
          )}
          
          {activeTab === "deployment" && (
            <DeploymentTab project={project} userProjects={userProjects} projectSlug={projectSlug} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Project Description */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Overview</h3>
          <p className="text-gray-300 mb-4">
            {project.description || "AI-powered infrastructure deployment for your application."}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Framework</p>
              <p className="text-white">{project.framework_info?.display_name || "Auto-detected"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Cloud Provider</p>
              <p className="text-white">Google Cloud Platform</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Region</p>
              <p className="text-white">us-central1</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Template</p>
              <p className="text-white">Cloud Run + Load Balancer</p>
            </div>
          </div>
        </div>

        {/* AI Workflow Progress */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            AI Workflow Progress
          </h3>
          
          <div className="space-y-4">
            <WorkflowStep
              title="Repository Analysis"
              description="AI analyzed your codebase and detected framework"
              status="completed"
              icon={<CpuChipIcon className="w-5 h-5" />}
            />
            <WorkflowStep
              title="Infrastructure Planning"
              description="Generated optimal cloud architecture for your app"
              status="completed"
              icon={<CloudIcon className="w-5 h-5" />}
            />
            <WorkflowStep
              title="Code Generation"
              description="Created Terraform files and deployment configurations"
              status="completed"
              icon={<CodeBracketIcon className="w-5 h-5" />}
            />
            <WorkflowStep
              title="Ready for Deployment"
              description="Everything is configured and ready to deploy"
              status={project.status === "ready_to_deploy" ? "ready" : "pending"}
              icon={<RocketLaunchIcon className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <EyeIcon className="w-5 h-5 text-gray-400" />
              <span className="text-white">View Generated Files</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <GitHubIcon className="w-5 h-5 text-gray-400" />
              <span className="text-white">View Repository</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <ServerIcon className="w-5 h-5 text-gray-400" />
              <span className="text-white">Infrastructure Preview</span>
            </button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-white">
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white">
                {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Monthly Cost</span>
              <span className="text-green-400">$25-50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-400" />
          AI Repository Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-3">Framework Detection</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Framework</span>
                <span className="text-blue-400">{project.framework_info?.display_name || "Next.js"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Language</span>
                <span className="text-blue-400">TypeScript</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Package Manager</span>
                <span className="text-blue-400">npm</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-3">Dependencies Analysis</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Database</span>
                <span className="text-green-400">PostgreSQL (detected)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Authentication</span>
                <span className="text-green-400">Clerk (detected)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Styling</span>
                <span className="text-green-400">Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 className="font-medium text-blue-400 mb-2">AI Recommendations</h4>
          <ul className="text-blue-300 text-sm space-y-1">
            <li>• Cloud Run is optimal for this Next.js application</li>
            <li>• PostgreSQL database recommended for data persistence</li>
            <li>• Load balancer suggested for high availability</li>
            <li>• Auto-scaling configured based on traffic patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InfrastructureTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Generated Infrastructure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <InfrastructureComponent
            name="Cloud Run Service"
            type="Compute"
            status="configured"
            description="Serverless container deployment"
          />
          <InfrastructureComponent
            name="Load Balancer"
            type="Network"
            status="configured"
            description="Global HTTP(S) load balancer"
          />
          <InfrastructureComponent
            name="Cloud SQL"
            type="Database"
            status="configured"
            description="Managed PostgreSQL database"
          />
          <InfrastructureComponent
            name="Cloud Storage"
            type="Storage"
            status="configured"
            description="Static assets and uploads"
          />
          <InfrastructureComponent
            name="IAM Roles"
            type="Security"
            status="configured"
            description="Service account permissions"
          />
          <InfrastructureComponent
            name="Monitoring"
            type="Observability"
            status="configured"
            description="Cloud Monitoring & Logging"
          />
        </div>
        
        <div className="border-t border-gray-800 pt-6">
          <h4 className="font-medium text-white mb-3">Generated Files</h4>
          <div className="space-y-2">
            <FileItem name="main.tf" type="terraform" size="2.4 KB" />
            <FileItem name="variables.tf" type="terraform" size="1.1 KB" />
            <FileItem name="outputs.tf" type="terraform" size="0.8 KB" />
            <FileItem name="Dockerfile" type="docker" size="0.5 KB" />
            <FileItem name="cloudbuild.yaml" type="config" size="0.7 KB" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeploymentTab({ project, userProjects, projectSlug }: { project: Project; userProjects: string; projectSlug: string }) {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Deployment Status</h3>
        
        {project.status === "ready_to_deploy" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Ready to Deploy!</h4>
            <p className="text-gray-400 mb-6">
              Your infrastructure is configured and ready for deployment to Google Cloud.
            </p>
            <button
              onClick={() => router.push(`/${userProjects}/${projectSlug}/deploy`)}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              Deploy to Google Cloud
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-xl font-semibold text-white mb-2">Preparing Deployment</h4>
            <p className="text-gray-400 mb-6">
              AI agents are still working on your infrastructure configuration.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowStep({
  title,
  description,
  status,
  icon,
}: {
  title: string;
  description: string;
  status: "completed" | "pending" | "ready";
  icon: React.ReactNode;
}) {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-400 border-green-400";
      case "ready":
        return "text-blue-400 border-blue-400";
      default:
        return "text-gray-400 border-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case "ready":
        return <PlayIcon className="w-4 h-4 text-blue-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${getStatusColor()}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white">{title}</h4>
          {getStatusIcon()}
        </div>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function InfrastructureComponent({
  name,
  type,
  status,
  description,
}: {
  name: string;
  type: string;
  status: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{name}</h4>
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
          {status}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-1">{type}</p>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}

function FileItem({ name, type, size }: { name: string; type: string; size: string }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "terraform":
        return "text-purple-400";
      case "docker":
        return "text-blue-400";
      case "config":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        <CodeBracketIcon className={`w-4 h-4 ${getTypeColor(type)}`} />
        <span className="text-white font-mono text-sm">{name}</span>
      </div>
      <span className="text-gray-400 text-xs">{size}</span>
    </div>
  );
}