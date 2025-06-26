import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import ImportRepository from './pages/ImportRepository'
import ProjectDetail from './pages/ProjectDetail'
import DeployProject from './pages/DeployProject'
import Header from './components/Header'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={
          <SignedIn>
            <Dashboard />
          </SignedIn>
        } />
        <Route path="/import" element={
          <SignedIn>
            <ImportRepository />
          </SignedIn>
        } />
        <Route path="/project/:id" element={
          <SignedIn>
            <ProjectDetail />
          </SignedIn>
        } />
        <Route path="/project/:id/deploy" element={
          <SignedIn>
            <DeployProject />
          </SignedIn>
        } />
      </Routes>
    </div>
  )
}

export default App