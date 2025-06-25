"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getUserProjectNamespace } from "@/lib/api/projects";

export default function ProjectsPage() {
  const { user } = useUser();
  const router = useRouter();

  // Redirect to user's project namespace
  useEffect(() => {
    if (user) {
      const userNamespace = getUserProjectNamespace(user);
      router.replace(`/${userNamespace}`);
    }
  }, [user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );
}
