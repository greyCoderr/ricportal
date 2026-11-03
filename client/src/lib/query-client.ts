import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

// Retry a failed query once, except for 4xx answers (asking again will not
// change them). Tests pass retry: false so error states show at once.
function retryOnce(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function createQueryClient(options: { retry?: false } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: options.retry ?? retryOnce },
    },
  });
}
