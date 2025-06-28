import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRightIcon, CloudIcon, CpuChipIcon, RocketLaunchIcon, CheckIcon, PlayIcon } from "@heroicons/react/24/outline";
import { GitHubIcon } from "@/components/ui/icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              AI-Native DevOps Automation Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
              From GitHub Repo to
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Production Infrastructure
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-gray-300">in Minutes</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Connect your GitHub repository, let AI analyze your codebase, and deploy production-ready infrastructure to AWS/GCP automatically. Zero manual configuration required.
            </p>

            {/* Demo Video Placeholder */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative aspect-video bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-700 transition-colors cursor-pointer">
                      <PlayIcon className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-gray-300 text-lg font-medium">Watch 3-Minute Demo</p>
                    <p className="text-gray-500 text-sm">See how Sirpi transforms any repo into production infrastructure</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <SignedOut>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/sign-up?redirect_url=/projects"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer inline-flex items-center justify-center"
                >
                  <span className="relative z-10 flex items-center">
                    Start Deploying Free
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-8 py-4 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white rounded-lg font-semibold transition-all duration-300 hover:bg-gray-800/50 cursor-pointer inline-flex items-center justify-center"
                >
                  See How It Works
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="mb-16">
                <Link
                  href="/projects"
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer inline-block"
                >
                  <span className="relative z-10 flex items-center">
                    Go to Dashboard
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
              </div>
            </SignedIn>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 text-sm text-gray-400 mb-16">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Multi-cloud support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Auto-scaling infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Production-ready templates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How Sirpi Works
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Four simple steps to transform your repository into production-ready infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            step="01"
            title="Connect GitHub"
            description="Securely link your repositories with our GitHub App integration"
            icon={<GitHubIcon className="w-8 h-8" />}
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            step="02"
            title="AI Analysis"
            description="Our AI analyzes your codebase, detects frameworks, and understands requirements"
            icon={<CpuChipIcon className="w-8 h-8" />}
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            step="03"
            title="Generate Templates"
            description="Choose from Docker, ECS, Kubernetes, or custom deployment templates"
            icon={<CloudIcon className="w-8 h-8" />}
            gradient="from-orange-500 to-red-500"
          />
          <FeatureCard
            step="04"
            title="Deploy"
            description="One-click deployment to AWS or GCP with monitoring and scaling"
            icon={<RocketLaunchIcon className="w-8 h-8" />}
            gradient="from-green-500 to-emerald-500"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose Sirpi?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built for developers who want to focus on code, not infrastructure complexity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard
            title="Zero Configuration"
            description="No YAML files, no complex setup. Just connect your repo and deploy."
            icon="⚡"
          />
          <BenefitCard
            title="Multi-Cloud Ready"
            description="Deploy to AWS, GCP, or Azure with the same simple workflow."
            icon="☁️"
          />
          <BenefitCard
            title="Cost Optimized"
            description="AI-powered resource sizing ensures you only pay for what you need."
            icon="💰"
          />
          <BenefitCard
            title="Production Grade"
            description="Auto-scaling, monitoring, security, and backup included by default."
            icon="🛡️"
          />
          <BenefitCard
            title="Framework Agnostic"
            description="Supports Next.js, React, Python, Node.js, Go, and more."
            icon="🔧"
          />
          <BenefitCard
            title="Real-time Monitoring"
            description="Track deployments, costs, and performance in real-time."
            icon="📊"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <StatCard number="10x" label="Faster Deployment" />
          <StatCard number="99.9%" label="Uptime Guarantee" />
          <StatCard number="24/7" label="AI Monitoring" />
          <StatCard number="$0" label="Setup Cost" />
        </div>
      </div>

      {/* Built with Bolt.new Badge */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
            <span className="text-yellow-400 font-medium">⚡ Built with Bolt.new</span>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Automate Your Infrastructure?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of developers who have simplified their deployment process with AI-powered infrastructure automation.
          </p>
          <SignedOut>
            <Link
              href="/sign-up?redirect_url=/projects"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Get Started Free
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/projects"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Go to Dashboard
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
  icon,
  gradient,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl"></div>
      <div className="relative p-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-700 rounded-2xl transition-all duration-300 hover:transform hover:scale-105">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${gradient} mb-6`}>
          {icon}
        </div>
        <div className="text-sm font-mono text-gray-500 mb-2">{step}</div>
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="p-6 bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-gray-700 rounded-xl transition-all duration-300 hover:transform hover:scale-105">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-6">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-gray-400 font-medium">{label}</div>
    </div>
  );
}