// Only what the menu import uses (DEC-031: @types/multer is not on the approved
// package list).
declare module "multer" {
  import type { Request, RequestHandler } from "express";

  type FileFilterCallback = (error: Error | null, accept?: boolean) => void;

  type Options = {
    storage?: unknown;
    limits?: { fileSize?: number; files?: number };
    fileFilter?: (
      req: Request,
      file: { originalname: string; mimetype: string },
      callback: FileFilterCallback,
    ) => void;
  };

  type Multer = { single: (field: string) => RequestHandler };

  function multer(options?: Options): Multer;

  namespace multer {
    function memoryStorage(): unknown;
    class MulterError extends Error {
      readonly code: string;
    }
  }

  export default multer;
}

declare namespace Express {
  namespace Multer {
    interface File {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }
  }
  interface Request {
    file?: Multer.File;
  }
}
