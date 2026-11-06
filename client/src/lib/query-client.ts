import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const SESSION_KEY = ["session"] as const;

// Retry a failed query once, except for 4xx answers (asking again will not
// change them). Tests pass retry: false so error states show at once.
function retryOnce(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function createQueryClient(options: { retry?: false } = {}) {
  // A 401 anywhere means the session ended (expired, disabled, password
  // changed elsewhere). Clearing the session query sends the guard to the
  // login page with the return path.
  function handleError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      client.setQueryData(SESSION_KEY, null);
    }
  }
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: { retry: options.retry ?? retryOnce },
    },
  });
  return client;
}
