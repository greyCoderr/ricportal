import { createBrowserRouter } from "react-router";
import { HealthPage } from "../features/health/pages/HealthPage";

// Phase 0: one route. Layout shells, 403 and 404 pages come in P0-T13.
export const router = createBrowserRouter([
  { path: "/", element: <HealthPage /> },
]);
