import {
  changePasswordSchema,
  loginSchema,
  parentSignupSchema,
  profileUpdateSchema,
  teacherSummaryQuerySchema,
} from "@ricportal/shared";
import type { Request, Response } from "express";
import { SESSION_COOKIE } from "../../core/auth-token.js";
import { currentUser } from "../../core/middleware/authenticate.js";
import { created, ok } from "../../core/response.js";
import { parseWith } from "../../core/validate.js";
import type { AuthService } from "./auth.service.js";

export function createAuthController(
  service: AuthService,
  config: { COOKIE_SECURE: boolean; SESSION_HOURS: number },
) {
  function setSessionCookie(res: Response, token: string): void {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.COOKIE_SECURE,
      maxAge: config.SESSION_HOURS * 3600 * 1000,
      path: "/",
    });
  }

  return {
    login: async (req: Request, res: Response) => {
      const { user, token } = await service.login(
        parseWith(loginSchema, req.body),
      );
      setSessionCookie(res, token);
      ok(res, user);
    },

    logout: async (req: Request, res: Response) => {
      await service.logout(currentUser(req).id);
      res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        sameSite: "lax",
        secure: config.COOKIE_SECURE,
        path: "/",
      });
      ok(res, { loggedOut: true });
    },

    me: async (req: Request, res: Response) => {
      res.set("Cache-Control", "no-store");
      ok(res, await service.me(currentUser(req).id));
    },

    profile: async (req: Request, res: Response) => {
      res.set("Cache-Control", "no-store");
      ok(res, await service.profile(currentUser(req).id));
    },

    activity: async (req: Request, res: Response) => {
      res.set("Cache-Control", "no-store");
      ok(res, await service.activity(currentUser(req)));
    },

    teacherSummary: async (req: Request, res: Response) => {
      res.set("Cache-Control", "no-store");
      const { summary, meta } = await service.teacherSummary(
        currentUser(req),
        parseWith(teacherSummaryQuerySchema, req.query),
      );
      ok(res, summary, meta);
    },

    logins: async (req: Request, res: Response) => {
      res.set("Cache-Control", "no-store");
      ok(res, await service.recentLogins(currentUser(req).id));
    },

    updateProfile: async (req: Request, res: Response) => {
      ok(
        res,
        await service.updateProfile(
          currentUser(req),
          parseWith(profileUpdateSchema, req.body),
        ),
      );
    },

    changePassword: async (req: Request, res: Response) => {
      const { user, token } = await service.changePassword(
        currentUser(req).id,
        parseWith(changePasswordSchema, req.body),
      );
      setSessionCookie(res, token);
      ok(res, user);
    },

    parentSignup: async (req: Request, res: Response) => {
      created(
        res,
        await service.parentSignup(parseWith(parentSignupSchema, req.body)),
      );
    },

    publicCenters: async (_req: Request, res: Response) => {
      ok(res, await service.publicCenters());
    },
  };
}

export type AuthController = ReturnType<typeof createAuthController>;
