import type { NotificationSettings } from "@/lib/os/live/types";
import type { ShopSettingsPayload } from "@/lib/os/types";
import type {
  DashboardPreferences,
  NotificationPreference,
  OperationRules,
  OsSettingsModel,
  TeamRolePreset,
  WarRoomSettings,
  WhatsAppTemplate,
} from "@/lib/os/settings/types";

export const OS_SETTINGS_STORAGE_KEY = "elie.os.settings.v2";

export const DEFAULT_SHOP_SETTINGS: ShopSettingsPayload = {
  shop_name: "ELIE PERFUMES",
  support_email: "contact@elie.ma",
  whatsapp: "+212 600 000 000",
  auto_validate: false,
  low_stock_alert: true,
  currency: "MAD",
  timezone: "Africa/Casablanca",
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreference[] = [
  { category: "orders", enabled: true, mobileEnabled: true, soundEnabled: false },
  { category: "stock", enabled: true, mobileEnabled: true, soundEnabled: true },
  { category: "business", enabled: true, mobileEnabled: true, soundEnabled: false },
  { category: "operators", enabled: true, mobileEnabled: false, soundEnabled: false },
  { category: "system", enabled: true, mobileEnabled: false, soundEnabled: false },
];

const DEFAULT_WAR_ROOM: WarRoomSettings = {
  enabled: true,
  preference: "auto",
  mobileDensity: "compact",
  urgencyThreshold: 8,
  slaThresholdMinutes: 40,
};

const DEFAULT_OPERATIONS_RULES: OperationRules = {
  highValueThreshold: 700,
  vipCustomerThreshold: 2800,
  priorityWeightAge: 35,
  priorityWeightValue: 30,
  riskWeightDelay: 40,
  riskWeightCallbacks: 30,
  autoFlagHighRisk: true,
  autoFlagHighValue: true,
  slaTargetMinutes: 35,
};

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "confirmation",
    label: "Confirmation",
    message: "Salam {{name}}, votre commande ELIE est prête à confirmer. On valide ensemble ?",
    active: true,
  },
  {
    id: "callback",
    label: "Callback",
    message: "Bonjour {{name}}, nous vous rappelons concernant votre commande. Quel créneau vous convient ?",
    active: true,
  },
  {
    id: "relaunch",
    label: "Relance",
    message: "{{name}}, votre sélection ELIE vous attend toujours. Répondez 1 pour confirmer aujourd'hui.",
    active: true,
  },
  {
    id: "delivery",
    label: "Livraison",
    message: "Votre commande ELIE est expédiée. Merci pour votre confiance.",
    active: true,
  },
  {
    id: "special_offer",
    label: "Offre spéciale",
    message: "Offre privée ELIE: -10% aujourd'hui avec le code VIP10.",
    active: false,
  },
];

const DEFAULT_TEAM_ROLES: TeamRolePreset[] = [
  { id: "admin", label: "Admin", canViewRevenue: true, canEditSettings: true, canManageTeam: true },
  { id: "manager", label: "Manager", canViewRevenue: true, canEditSettings: true, canManageTeam: false },
  { id: "operator", label: "Operator", canViewRevenue: false, canEditSettings: false, canManageTeam: false },
];

const DEFAULT_DASHBOARD_PREFS: DashboardPreferences = {
  defaultPeriodDays: 7,
  widgets: ["kpi", "alerts", "urgent_queue", "stock_health", "live_feed"],
  sectionOrder: ["hero", "kpis", "alerts", "quick_actions", "insights", "activity"],
  operatorDensity: "comfortable",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createDefaultOsSettingsModel(shop?: ShopSettingsPayload): OsSettingsModel {
  const baseShop = shop ?? DEFAULT_SHOP_SETTINGS;

  return {
    shop: {
      ...baseShop,
      teamHours: "09:00 - 21:00",
    },
    notificationPreferences: DEFAULT_NOTIFICATION_PREFS,
    toastsEnabled: true,
    soundsEnabled: false,
    refreshIntervalSec: 30,
    warRoom: DEFAULT_WAR_ROOM,
    operations: DEFAULT_OPERATIONS_RULES,
    whatsappTemplates: DEFAULT_TEMPLATES,
    teamRoles: DEFAULT_TEAM_ROLES,
    dashboard: DEFAULT_DASHBOARD_PREFS,
  };
}

export function mapShopAndLiveToSettingsModel(
  shopSettings: ShopSettingsPayload,
  liveSettings: NotificationSettings,
  persisted?: Partial<OsSettingsModel>
): OsSettingsModel {
  const base = createDefaultOsSettingsModel(shopSettings);

  const notificationPreferences = base.notificationPreferences.map((pref) => ({
    ...pref,
    enabled: liveSettings.categoriesEnabled[pref.category],
  }));

  const merged: OsSettingsModel = {
    ...base,
    ...persisted,
    shop: {
      ...base.shop,
      ...persisted?.shop,
      ...shopSettings,
      teamHours: persisted?.shop?.teamHours ?? base.shop.teamHours,
    },
    notificationPreferences,
    toastsEnabled: liveSettings.toastsEnabled,
    soundsEnabled: liveSettings.soundsEnabled,
    refreshIntervalSec: clamp(liveSettings.refreshIntervalSec, 30, 300),
    warRoom: {
      ...base.warRoom,
      ...persisted?.warRoom,
      preference: liveSettings.warRoomPreference,
      slaThresholdMinutes: clamp(liveSettings.slaWarningMinutes, 15, 240),
    },
    operations: {
      ...base.operations,
      ...persisted?.operations,
    },
    whatsappTemplates: persisted?.whatsappTemplates ?? base.whatsappTemplates,
    teamRoles: persisted?.teamRoles ?? base.teamRoles,
    dashboard: {
      ...base.dashboard,
      ...persisted?.dashboard,
    },
  };

  return merged;
}

export function mapModelToShopPayload(model: OsSettingsModel): ShopSettingsPayload {
  return {
    shop_name: model.shop.shop_name,
    support_email: model.shop.support_email,
    whatsapp: model.shop.whatsapp,
    auto_validate: model.shop.auto_validate,
    low_stock_alert: model.shop.low_stock_alert,
    currency: model.shop.currency,
    timezone: model.shop.timezone,
  };
}

export function mapModelToLiveSettings(model: OsSettingsModel): Partial<NotificationSettings> {
  return {
    toastsEnabled: model.toastsEnabled,
    soundsEnabled: model.soundsEnabled,
    refreshIntervalSec: clamp(model.refreshIntervalSec, 30, 300),
    slaWarningMinutes: clamp(model.warRoom.slaThresholdMinutes, 15, 240),
    warRoomPreference: model.warRoom.preference,
    categoriesEnabled: {
      orders: model.notificationPreferences.find((pref) => pref.category === "orders")?.enabled ?? true,
      stock: model.notificationPreferences.find((pref) => pref.category === "stock")?.enabled ?? true,
      business: model.notificationPreferences.find((pref) => pref.category === "business")?.enabled ?? true,
      operators: model.notificationPreferences.find((pref) => pref.category === "operators")?.enabled ?? true,
      system: model.notificationPreferences.find((pref) => pref.category === "system")?.enabled ?? true,
    },
  };
}

export function loadPersistedOsSettings(): Partial<OsSettingsModel> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(OS_SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<OsSettingsModel>;
  } catch {
    return null;
  }
}

export function persistOsSettings(model: OsSettingsModel): void {
  if (typeof window === "undefined") return;

  const payload: Partial<OsSettingsModel> = {
    shop: {
      teamHours: model.shop.teamHours,
      shop_name: model.shop.shop_name,
      support_email: model.shop.support_email,
      whatsapp: model.shop.whatsapp,
      auto_validate: model.shop.auto_validate,
      low_stock_alert: model.shop.low_stock_alert,
      currency: model.shop.currency,
      timezone: model.shop.timezone,
    },
    notificationPreferences: model.notificationPreferences,
    toastsEnabled: model.toastsEnabled,
    soundsEnabled: model.soundsEnabled,
    refreshIntervalSec: model.refreshIntervalSec,
    warRoom: model.warRoom,
    operations: model.operations,
    whatsappTemplates: model.whatsappTemplates,
    teamRoles: model.teamRoles,
    dashboard: model.dashboard,
  };

  window.localStorage.setItem(OS_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
}
