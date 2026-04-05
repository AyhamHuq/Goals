#!/usr/bin/env node
/**
 * Generates a GitHub App installation access token for goals-claude-bot.
 *
 * Usage:
 *   node scripts/github-app-token.mjs              → prints the raw token
 *   node scripts/github-app-token.mjs --git-creds  → prints git credential helper format
 *
 * Requires:
 *   GITHUB_APP_ID  env var (or hardcoded APP_ID below)
 *   GITHUB_APP_PEM env var (path to .pem) or auto-discovered *.pem in repo root
 */

import { createSign } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_ID = process.env.GITHUB_APP_ID || '3283225';
const REPO = 'AyhamHuq/Goals';

function findPem() {
  const explicit = process.env.GITHUB_APP_PEM;
  if (explicit) return explicit;
  const pem = readdirSync(ROOT).find(f => f.endsWith('.pem'));
  if (!pem) throw new Error('No .pem file found in repo root. Set GITHUB_APP_PEM env var.');
  return join(ROOT, pem);
}

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 300, iss: String(appId) }));
  const unsigned = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  const sig = sign.sign(privateKey, 'base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${unsigned}.${sig}`;
}

async function getInstallationId(jwt) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/installation`, {
    headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`Failed to get installation: ${res.status} ${await res.text()}`);
  return (await res.json()).id;
}

async function getAccessToken(jwt, installationId) {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, Accept: 'application/vnd.github+json' },
    }
  );
  if (!res.ok) throw new Error(`Failed to get access token: ${res.status} ${await res.text()}`);
  return (await res.json()).token;
}

const privateKey = readFileSync(findPem(), 'utf8');
const jwt = createJWT(APP_ID, privateKey);
const installationId = await getInstallationId(jwt);
const token = await getAccessToken(jwt, installationId);

if (process.argv.includes('--git-creds')) {
  process.stdout.write(`username=x-access-token\npassword=${token}\n`);
} else {
  process.stdout.write(token);
}
