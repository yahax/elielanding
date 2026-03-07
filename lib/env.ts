import { z } from 'zod';

/**
 * Zod validation for required environment variables.
 * If any are missing, the dashboard shows a friendly config error.
 */
const envSchema = z.object({
    // Supabase (required)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is too short'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY is too short').optional(),

    // Offer mode
    NEXT_PUBLIC_OFFER_MODE: z.enum(['ramadan', 'standard']).default('ramadan'),

    // Dashboard password (simple auth)
    DASHBOARD_PASSWORD: z.string().min(1).optional(),

    // Google Sheets (optional)
    APPS_SCRIPT_URL: z.string().url().optional(),
    APPS_SCRIPT_SECRET: z.string().optional(),

});

export type Env = z.infer<typeof envSchema>;

let _parsedEnv: Env | null = null;
let _envError: string | null = null;

export function getEnv(): Env {
    if (_parsedEnv) return _parsedEnv;

    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n');
        _envError = errors;
        console.error('[ELIE] Environment validation failed:\n' + errors);
        // Return a partial env with defaults so the app doesn't crash
        return {
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            NEXT_PUBLIC_OFFER_MODE: (process.env.NEXT_PUBLIC_OFFER_MODE as 'ramadan' | 'standard') || 'ramadan',
        } as Env;
    }

    _parsedEnv = result.data;
    return _parsedEnv;
}

export function getEnvError(): string | null {
    if (_parsedEnv === null && _envError === null) {
        getEnv(); // trigger validation
    }
    return _envError;
}

export function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return !!url && url !== '' && url !== 'https://your-project.supabase.co';
}
