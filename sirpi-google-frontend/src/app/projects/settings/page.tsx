"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Manage your account and project preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="text-white">
                {user?.emailAddresses[0]?.emailAddress}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <div className="text-white">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
            {user?.username && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <div className="text-white">{user.username}</div>
              </div>
            )}
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            GitHub Integration
          </h2>
          <p className="text-gray-400 mb-4">
            Manage your GitHub connection and repository access.
          </p>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
            Disconnect GitHub
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-gray-900 border border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-gray-400 mb-4">
            These actions are irreversible. Please be careful.
          </p>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
