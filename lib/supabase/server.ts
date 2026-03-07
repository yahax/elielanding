import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server client with cookie-based auth — for dashboard/OS API routes.
 * Respects RLS (authenticated users only).
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Ignore in read-only server components
                }
            },
        },
    });
}

/**
 * Service-role client — bypasses RLS.
 * Use ONLY in server-side API routes for public order creation.
 * NEVER expose to the browser.
 */
export function createServiceSupabaseClient() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('[Supabase Server] Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
        throw new Error('Supabase service role client is not configured correctly. Check your environment variables.');
    }
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
