import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const HEADER = "X-Request-Id";
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.get(HEADER);
  const id =
    incoming !== undefined && SAFE_REQUEST_ID.test(incoming)
      ? incoming
      : randomUUID();
  req.requestId = id;
  res.setHeader(HEADER, id);
  next();
}
