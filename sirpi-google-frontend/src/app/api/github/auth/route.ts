import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function GET() {
  try {
    console.log("GitHub auth route called");

    // Get the authenticated user
    const { userId, getToken } = await auth();

    console.log("User ID:", userId);

    if (!userId) {
      console.log("No user ID, redirecting to sign-in");
      redirect("/sign-in");
    }

    // Get the JWT token
    const token = await getToken();

    console.log("Token exists:", !!token);

    if (!token) {
      console.log("No token, redirecting to sign-in");
      redirect("/sign-in");
    }

    // Make authenticated request to backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    console.log("Making request to:", `${backendUrl}/api/github/auth`);

    const response = await fetch(`${backendUrl}/api/github/auth`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      redirect: "manual", // Don't follow redirects automatically
    });

    console.log("Backend response status:", response.status);
    console.log(
      "Backend response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.status === 302 || response.status === 307) {
      // Get the redirect URL from the Location header
      const redirectUrl = response.headers.get("Location");
      console.log("Redirecting to:", redirectUrl);
      if (redirectUrl) {
        redirect(redirectUrl);
      }
    }

    // Check for other successful responses
    if (response.ok) {
      const data = await response.text();
      console.log("Backend response data:", data);
    }

    // If we get here, something went wrong
    console.log("Unexpected response, redirecting to projects with error");
    redirect("/projects?error=github_auth_failed");
  } catch (error) {
    // Check if this is a Next.js redirect error (which is normal)
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      // This is a normal redirect, let it propagate
      throw error;
    }

    console.error("GitHub auth error:", error);
    redirect("/projects?error=github_auth_failed");
  }
}
