import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.stack);
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}
