import type { NotificationCategory, WarRoomPreference } from "@/lib/os/live/types";
import type { ShopSettingsPayload } from "@/lib/os/types";

export type SettingsSectionType =
  | "shop"
  | "notifications"
  | "war_room"
  | "operations"
  | "whatsapp_templates"
  | "team_access"
  | "dashboard_preferences";

export interface NotificationPreference {
  category: Exclude<NotificationCategory, "all">;
  enabled: boolean;
  mobileEnabled: boolean;
  soundEnabled: boolean;
}

export interface WarRoomSettings {
  enabled: boolean;
  preference: WarRoomPreference;
  mobileDensity: "comfortable" | "compact";
  urgencyThreshold: number;
  slaThresholdMinutes: number;
}

export interface OperationRules {
  highValueThreshold: number;
  vipCustomerThreshold: number;
  priorityWeightAge: number;
  priorityWeightValue: number;
  riskWeightDelay: number;
  riskWeightCallbacks: number;
  autoFlagHighRisk: boolean;
  autoFlagHighValue: boolean;
  slaTargetMinutes: number;
}

export interface WhatsAppTemplate {
  id: "confirmation" | "callback" | "relaunch" | "delivery" | "special_offer";
  label: string;
  message: string;
  active: boolean;
}

export interface TeamRolePreset {
  id: "admin" | "manager" | "operator";
  label: string;
  canViewRevenue: boolean;
  canEditSettings: boolean;
  canManageTeam: boolean;
}

export interface DashboardPreferences {
  defaultPeriodDays: 7 | 30;
  widgets: string[];
  sectionOrder: string[];
  operatorDensity: "comfortable" | "compact";
}

export interface OsSettingsModel {
  shop: ShopSettingsPayload & {
    teamHours: string;
  };
  notificationPreferences: NotificationPreference[];
  toastsEnabled: boolean;
  soundsEnabled: boolean;
  refreshIntervalSec: number;
  warRoom: WarRoomSettings;
  operations: OperationRules;
  whatsappTemplates: WhatsAppTemplate[];
  teamRoles: TeamRolePreset[];
  dashboard: DashboardPreferences;
}
