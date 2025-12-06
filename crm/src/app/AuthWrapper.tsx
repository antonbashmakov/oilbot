"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/api/user/provider";

// Define public paths that don't require authentication
const publicPaths = ["/login", "/signup", "/approve"];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isError } = useUser();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    const hasUser = !!user;
    const hasRoles = user?.roles && user.roles.length > 0;

    // If it's a public path and user is logged in with roles, redirect to home page
    if (isPublicPath && hasUser && hasRoles) {
      // Don't redirect from /approve if user has no roles
      if (pathname.startsWith("/approve")) {
        return;
      }
      router.push("/");
      return;
    }

    // If it's a protected path and no user is logged in, redirect to login
    if (!isPublicPath && !hasUser) {
      // Store the attempted URL for redirect after login
      const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    console.log(user)
    // If user is logged in but has no roles, redirect to /approve (except for /approve itself)
    if (hasUser && !hasRoles && !pathname.startsWith("/approve")) {
      router.push("/approve");
      return;
    }

    // If user is logged in with roles and tries to access /approve, redirect to home
    if (hasUser && hasRoles && pathname.startsWith("/approve")) {
      router.push("/");
      return;
    }
  }, [user, isLoading, isError, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
