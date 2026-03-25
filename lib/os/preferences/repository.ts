import type { UserPreferences } from "@/lib/os/domain/types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { createDefaultUserPreferences } from "@/lib/os/preferences/defaults";
import { getOsMemoryStore } from "@/lib/os/server/memory-store";

export type UserPreferencesPatch = {
  warRoomMode?: UserPreferences["warRoomMode"];
  notifications?: Partial<Omit<UserPreferences["notifications"], "categoriesEnabled">> & {
    categoriesEnabled?: Partial<UserPreferences["notifications"]["categoriesEnabled"]>;
  };
  dashboard?: Partial<Omit<UserPreferences["dashboard"], "savedViews">> & {
    savedViews?: UserPreferences["dashboard"]["savedViews"];
  };
  mobile?: Partial<UserPreferences["mobile"]>;
  operations?: Partial<UserPreferences["operations"]>;
  metadata?: Record<string, unknown>;
};

function isMissingTableError(error: unknown): boolean {
  if (typeof error !== "object" || error == null) return false;
  const code = "code" in error ? String((error as { code?: string }).code) : "";
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mergePreferences(base: UserPreferences, patch: UserPreferencesPatch): UserPreferences {
  const nextReadIds = patch.metadata?.notificationReadIds;
  const currentReadIds = Array.isArray(base.metadata.notificationReadIds)
    ? (base.metadata.notificationReadIds as string[])
    : [];

  const mergedNotifications = {
    ...base.notifications,
    ...(patch.notifications ?? {}),
    categoriesEnabled: {
      ...base.notifications.categoriesEnabled,
      ...(patch.notifications?.categoriesEnabled ?? {}),
    },
  };

  return {
    ...base,
    ...patch,
    notifications: {
      ...mergedNotifications,
      refreshIntervalSec: clamp(Number(mergedNotifications.refreshIntervalSec ?? 30), 30, 300),
      slaWarningMinutes: clamp(Number(mergedNotifications.slaWarningMinutes ?? 40), 10, 480),
    },
    dashboard: {
      ...base.dashboard,
      ...(patch.dashboard ?? {}),
      savedViews: patch.dashboard?.savedViews ?? base.dashboard.savedViews,
    },
    mobile: {
      ...base.mobile,
      ...(patch.mobile ?? {}),
    },
    operations: {
      ...base.operations,
      ...(patch.operations ?? {}),
    },
    metadata: {
      ...base.metadata,
      ...(patch.metadata ?? {}),
      notificationReadIds: uniqueStrings([
        ...currentReadIds,
        ...(Array.isArray(nextReadIds) ? (nextReadIds as string[]) : []),
      ]).slice(-3000),
    },
    updatedAt: new Date().toISOString(),
  };
}

async function fetchFromSupabase(userId: string): Promise<UserPreferences | null> {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("os_user_preferences")
    .select("user_id,payload,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return null;
    }
    throw error;
  }

  if (!data) return null;

  const payload = (data.payload as Partial<UserPreferences> | null) ?? {};
  const baseline = createDefaultUserPreferences(userId);
  return mergePreferences(
    {
      ...baseline,
      ...payload,
      userId,
      updatedAt: data.updated_at ?? baseline.updatedAt,
    },
    {}
  );
}

async function persistToSupabase(preferences: UserPreferences): Promise<void> {
  const supabase = createServiceSupabaseClient();
  const { error } = await supabase.from("os_user_preferences").upsert(
    {
      user_id: preferences.userId,
      payload: preferences,
      updated_at: preferences.updatedAt,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const store = getOsMemoryStore();
  const memory = store.preferences.get(userId);
  if (memory) return memory;

  try {
    const dbPreferences = await fetchFromSupabase(userId);
    if (dbPreferences) {
      store.preferences.set(userId, dbPreferences);
      return dbPreferences;
    }
  } catch (error) {
    console.warn("[PREFERENCES] fallback to memory due to error:", error);
  }

  const defaults = createDefaultUserPreferences(userId);
  store.preferences.set(userId, defaults);
  return defaults;
}

export async function saveUserPreferences(userId: string, patch: UserPreferencesPatch): Promise<UserPreferences> {
  const current = await getUserPreferences(userId);
  const next = mergePreferences(current, patch);
  const store = getOsMemoryStore();
  store.preferences.set(userId, next);

  try {
    await persistToSupabase(next);
  } catch (error) {
    console.warn("[PREFERENCES] persist fallback to memory:", error);
  }

  return next;
}

export async function markNotificationsRead(userId: string, notificationIds: string[]): Promise<UserPreferences> {
  const normalizedIds = uniqueStrings(notificationIds);
  if (normalizedIds.length === 0) {
    return getUserPreferences(userId);
  }

  return saveUserPreferences(userId, {
    metadata: {
      notificationReadIds: normalizedIds,
    },
  });
}
