import type { AuthUser } from "../core/scope.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      // Set by the authenticate middleware.
      user?: AuthUser;
    }
  }
}

export {};
