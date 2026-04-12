import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';

const COOKIE_NAME = 'admin_token';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

function signToken(): string {
  const payload = `admin:${Math.floor(Date.now() / 1000)}`;
  const sig = crypto.createHmac('sha256', config.adminPin || 'fallback').update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', config.adminPin || 'fallback').update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

export function adminLogin(req: Request, res: Response): void {
  const { pin } = req.body as { pin?: string };
  if (!pin || !config.adminPin) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const pinBuf = Buffer.from(pin);
  const expectedBuf = Buffer.from(config.adminPin);
  const match =
    pinBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(pinBuf, expectedBuf);

  if (!match) {
    res.status(401).json({ error: 'Invalid PIN' });
    return;
  }

  const token = signToken();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.nodeEnv === 'production',
    maxAge: COOKIE_MAX_AGE * 1000,
  });
  res.json({ ok: true });
}

export function adminLogout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { sameSite: 'strict', secure: config.nodeEnv === 'production' });
  res.json({ ok: true });
}

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
