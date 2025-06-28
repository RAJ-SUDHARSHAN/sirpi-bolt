"use client";

import React from "react";

interface BoltBadgeProps {
  variant?: "default" | "large" | "minimal";
  className?: string;
}

export function BoltBadge({ variant = "default", className = "" }: BoltBadgeProps) {
  const baseClasses = "inline-flex items-center gap-2 font-medium transition-all duration-300 hover:scale-105";
  
  const variants = {
    default: "px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm",
    large: "px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-base",
    minimal: "px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-400 text-xs"
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      <span className="text-yellow-400">⚡</span>
      <span>Built with Bolt.new</span>
    </div>
  );
}

export function BoltBadgeFloating() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <span className="text-lg">⚡</span>
          <span className="hidden sm:inline">Built with Bolt.new</span>
          <span className="sm:hidden">Bolt.new</span>
        </div>
      </a>
    </div>
  );
}