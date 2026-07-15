// Typed access to Cloudflare Worker bindings + environment variables.
// In Astro v6 with the Cloudflare adapter, bindings come from `cloudflare:workers`.
import { env as cfEnv } from 'cloudflare:workers';

export interface ABGLEnv {
  DB: D1Database;
  NOTIFY_INVESTOR: string;
  NOTIFY_CONTACT: string;
  NOTIFY_NEWSLETTER: string;
  NOTIFY_FROM: string;
  BRAND_NAME: string;
  ASSETS: Fetcher;
  // Resend transactional email API key — set via `wrangler secret put RESEND_API_KEY`.
  RESEND_API_KEY: string;
}

export const env = cfEnv as unknown as ABGLEnv;
