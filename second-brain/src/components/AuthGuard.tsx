"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't guard the login page itself
    if (pathname === "/login") {
      setAuthState("authenticated");
      return;
    }

    fetch("/api/auth")
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setAuthState("authenticated");
        } else {
          setAuthState("unauthenticated");
          router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        }
      })
      .catch(() => {
        // Fail open on network error (LAN-first design)
        setAuthState("authenticated");
      });
  }, [pathname, router]);

  if (authState === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="font-terminal text-green-500 text-2xl animate-pulse">
          AUTHENTICATING...
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return null; // Redirecting
  }

  return <>{children}</>;
}

// Hook to logout from anywhere in the app
export function useLogout() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    // Clear the session cookie client-side too
    document.cookie = "rv-session=; max-age=0; path=/";
    router.push("/login");
  };
  return logout;
}
