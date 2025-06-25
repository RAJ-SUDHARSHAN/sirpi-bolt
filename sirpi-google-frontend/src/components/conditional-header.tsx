"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function ConditionalHeader() {
  const pathname = usePathname();
  const [shouldHide, setShouldHide] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const isProjectsPage = pathname?.startsWith("/projects");
    const isUserProjectsPage = pathname?.split("/")[1]?.endsWith("-projects");

    setShouldHide(isProjectsPage || isUserProjectsPage);
  }, [pathname]);

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  if (shouldHide) {
    return null;
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <Link href="/" className="flex items-center cursor-pointer">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Sirpi
            </div>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link
                href="/sign-in?redirect_url=/projects"
                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up?redirect_url=/projects"
                className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Try for free
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-gray-900 border border-gray-800",
                    userButtonPopoverActionButton:
                      "text-gray-300 hover:text-white hover:bg-gray-800",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
