import { OsLoginForm } from "@/components/os/login/OsLoginForm";

function normalizeRedirect(
  value: string | string[] | undefined
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "/os";

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return "/os";
  if (trimmed.startsWith("//")) return "/os";

  return trimmed;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string | string[] };
}) {
  const redirectTo = normalizeRedirect(searchParams?.redirect);
  return <OsLoginForm redirectTo={redirectTo} />;
}
