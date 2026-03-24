type EnvValidationResult =
    | { valid: true; elieOsPassword: string; elieOsSecret: string }
    | { valid: false; missing: string[] };

export function validateOsAuthEnv(): EnvValidationResult {
    const requiredVars = [
        'ELIE_OS_PASSWORD',
        'ELIE_OS_SECRET',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing = requiredVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`[OS/Env] Critical missing environment variables: ${missing.join(', ')}`);
        return { valid: false, missing };
    }

    return {
        valid: true,
        elieOsPassword: process.env.ELIE_OS_PASSWORD as string,
        elieOsSecret: process.env.ELIE_OS_SECRET as string,
    };
}
