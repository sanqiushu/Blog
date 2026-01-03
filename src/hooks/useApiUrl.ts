"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook to build API URLs with flight parameters from the current URL
 * This allows passing query parameters like ?flight=skipCache to API calls
 */
export function useApiUrl() {
  const searchParams = useSearchParams();

  const getApiUrl = useCallback((baseUrl: string) => {
    const flight = searchParams.get("flight");
    if (flight) {
      const separator = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${separator}flight=${flight}`;
    }
    return baseUrl;
  }, [searchParams]);

  return { getApiUrl };
}
