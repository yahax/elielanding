import type { UserPreferences } from "@/lib/os/domain/types";

export function createDefaultUserPreferences(userId: string): UserPreferences {
  return {
    userId,
    warRoomMode: "auto",
    notifications: {
      toastsEnabled: true,
      soundsEnabled: false,
      refreshIntervalSec: 30,
      slaWarningMinutes: 40,
      categoriesEnabled: {
        orders: true,
        stock: true,
        business: true,
        operators: true,
        system: true,
      },
    },
    dashboard: {
      defaultPeriodDays: 7,
      widgets: ["kpi", "alerts", "urgent_queue", "stock_health", "live_feed"],
      savedViews: [],
    },
    mobile: {
      density: "compact",
    },
    operations: {
      highValueThreshold: 700,
      slaTargetMinutes: 35,
    },
    updatedAt: new Date().toISOString(),
    metadata: {
      notificationReadIds: [],
      operationsRules: {},
    },
  };
}
