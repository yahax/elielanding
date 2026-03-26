type EnvValidationResult =
  | {
      valid: true;
      elieOsPassword: string;
      elieOsSecret: string;
      missingOptional: string[];
    }
  | {
      valid: false;
      issues: string[];
      missingOptional: string[];
    };

const AUTH_REQUIRED_ENV_KEYS = ["ELIE_OS_PASSWORD", "ELIE_OS_SECRET"] as const;
const AUTH_OPTIONAL_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

function readEnv(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function validateOsAuthEnv(): EnvValidationResult {
  const missingRequired = AUTH_REQUIRED_ENV_KEYS.filter((key) => readEnv(key).length === 0);
  const issues: string[] = [...missingRequired];

  const secret = readEnv("ELIE_OS_SECRET");
  const password = readEnv("ELIE_OS_PASSWORD");

  if (secret.length > 0 && secret.length < 16) {
    issues.push("ELIE_OS_SECRET (must be at least 16 characters)");
  }
  if (password.length > 0 && password.length < 4) {
    issues.push("ELIE_OS_PASSWORD (must be at least 4 characters)");
  }

  const missingOptional = AUTH_OPTIONAL_ENV_KEYS.filter((key) => readEnv(key).length === 0);

  if (issues.length > 0) {
    console.error(`[OS/Env] Invalid auth configuration: ${issues.join(", ")}`);
    return { valid: false, issues, missingOptional };
  }

  return {
    valid: true,
    elieOsPassword: password,
    elieOsSecret: secret,
    missingOptional,
  };
}
