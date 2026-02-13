export type ThemeMode = "light" | "dark";

export interface UserSettings {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  selectedTenantId: string | null;
  cartAutoOpenOnAdd: boolean;
}

export type UserSettingsUpdate = Partial<UserSettings>;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "light",
  sidebarCollapsed: false,
  selectedTenantId: null,
  cartAutoOpenOnAdd: true,
};

export interface UserSettingsResponse {
  settings: UserSettings;
  hasStoredSettings?: boolean;
}
