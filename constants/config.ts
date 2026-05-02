// Supabase and app config — values loaded from environment variables at build time.
// Copy .env.example to .env.local and fill in your Supabase project details.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''
export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? ''
export const POSTHOG_HOST = 'https://app.posthog.com'
