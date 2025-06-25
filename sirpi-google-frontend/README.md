# Sirpi Google ADK Frontend

This is the frontend application for the Sirpi Google ADK (Agent Development Kit) multi-agent deployment platform. It provides a modern, responsive web interface for managing multi-agent workflows that deploy infrastructure to Google Cloud Platform.

## Features

- **Multi-Agent Workflows**: Visual interface for coordinating AI agents (Infrastructure Analyzer, Deployment Planner, Code Generator, Deployment Orchestrator)
- **Google Cloud Integration**: Deploy to GCP with Cloud Run, Cloud Storage, and other GCP services
- **Real-time Monitoring**: Live deployment logs and status updates
- **Repository Management**: Connect and analyze GitHub repositories with AI-powered framework detection
- **Clerk Authentication**: Secure user authentication and management
- **Responsive Design**: Modern, dark-themed UI with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk
- **Language**: TypeScript
- **Build Tool**: Turbopack (Next.js built-in)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn or pnpm
- A Google Cloud Project
- Clerk account for authentication

### Installation

   ```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

   ```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

   # Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Optional: Clerk URLs (for custom domains)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```
   
### Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint the code
npm run lint
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── [userProjects]/     # Dynamic user project routes
│   ├── api/               # API routes (if any)
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/           
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
├── lib/                   # Utilities and API clients
│   ├── api/              # API client functions
│   └── api-client.ts     # Base API client
└── middleware.ts         # Clerk authentication middleware
```

## API Integration

This frontend connects to the Sirpi Google ADK backend (`sirpi-google`), which provides:

- Multi-agent workflow orchestration
- Google Cloud resource management
- Repository analysis and framework detection
- Real-time deployment streaming
- Terraform infrastructure generation

## Multi-Agent Workflow

The platform coordinates four specialized AI agents:

1. **Infrastructure Analyzer**: Analyzes repository structure and requirements
2. **Deployment Planner**: Designs optimal GCP infrastructure architecture  
3. **Code Generator**: Generates Terraform, Dockerfiles, and configurations
4. **Deployment Orchestrator**: Manages actual resource deployment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
