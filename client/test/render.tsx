import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { createQueryClient } from "../src/lib/query-client";

// Renders with a fresh QueryClient that never retries, so error states show at once.
export function renderWithQuery(ui: ReactElement) {
  const client = createQueryClient({ retry: false });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}
