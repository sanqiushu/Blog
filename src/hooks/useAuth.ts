"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/check");
      const data = await response.json();

      if (!data.authenticated) {
        router.push("/login");
        return;
      }

      setAuthenticated(true);
    } catch (error) {
      console.error("认证检查失败:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return { authenticated, loading };
}
