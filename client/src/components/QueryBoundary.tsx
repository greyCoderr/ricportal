import type { ReactNode } from "react";
import { ForbiddenPage } from "../app/pages/ForbiddenPage";
import { ApiError } from "../lib/api";
import { ErrorState, Skeleton, SkeletonGroup } from "./ui";

type QueryLike = {
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  error: unknown;
  refetch: () => unknown;
};

type QueryBoundaryProps = {
  query: QueryLike;
  // Plain words with real names, for example "Could not load the students."
  errorTitle: string;
  loadingLabel?: string;
  children: ReactNode;
};

// The loading, error and forbidden states every screen needs (sprint plan,
// section 5). A 403 shows the 403 page; anything else offers Retry.
export function QueryBoundary({
  query,
  errorTitle,
  loadingLabel,
  children,
}: QueryBoundaryProps) {
  if (query.isPending) {
    return (
      <SkeletonGroup label={loadingLabel} className="flex flex-col gap-3 py-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </SkeletonGroup>
    );
  }
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 403) {
      return <ForbiddenPage />;
    }
    return (
      <ErrorState
        title={errorTitle}
        message={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => {
          query.refetch();
        }}
        retrying={query.isFetching}
      />
    );
  }
  return children;
}
