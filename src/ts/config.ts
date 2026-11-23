import {
  AdditionalFeature,
  AvailableCategory,
  AvailableSection,
  additionalFeeds,
  availableCategories,
  availableSections,
  defaultCategories,
  defaultMaxStories,
  defaultSections,
} from "./types";
import { createLogger } from "../lib/logger";

const log = createLogger("KNJSConfig");

/**
 * Application configuration interface
 * @property selectedAdditionalFeeds The selected additional feeds
 * @property newsRefreshPinSetting Whether the news refresh Timeline pin is enabled
 * @property selectedTextSize The selected text size
 * @property selectedInterfaceLanguage The selected interface language
 * @property selectedContentLanguage The selected content language
 * @property selectedMaxStoryCount The selected maximum story count
 * @property selectedSectionNames The enabled section names
 * @property selectedCategoryNames The enabled category names
 * @property isTensionIndexEnabled Whether the tension index is enabled
 */
export interface AppConfig {
  selectedAdditionalFeeds: AdditionalFeature[];
  newsRefreshPinSetting: boolean;
  selectedTextSize: number;
  selectedInterfaceLanguage: string;
  selectedContentLanguage: string;
  selectedMaxStoryCount: number;
  selectedSectionNames: AvailableSection[];
  selectedCategoryNames: AvailableCategory[];
  isTensionIndexEnabled: boolean;
}

const CONFIG_DEFAULTS: AppConfig = {
  selectedAdditionalFeeds: [],
  newsRefreshPinSetting: false,
  selectedTextSize: 0,
  selectedInterfaceLanguage: "",
  selectedContentLanguage: "",
  selectedMaxStoryCount: defaultMaxStories,
  selectedSectionNames: defaultSections,
  selectedCategoryNames: defaultCategories,
  isTensionIndexEnabled: true,
};

const CONFIG_KEY = "kagi_news_config";

/** The "Clear Cache On Save" checkboxes, in Clay option order. */
export const CLEAR_CACHE_OPTIONS = [
  "Clear full cache",
  "Clear timeline pin memory",
  "Clear read stories memory",
  "Clear network cache",
] as const;

export type ClearCacheOption = (typeof CLEAR_CACHE_OPTIONS)[number];

/**
 * A Clay config page response as returned by `clay.getSettings(response, false)`.
 * Keyed by messageKey *name* and wrapped in `{ value }`, which keeps the config
 * independent of the numeric AppMessage key layout in package.json.
 */
export type ClaySettings = Record<string, { value?: unknown } | undefined>;

const readValue = <T>(settings: ClaySettings, key: string, fallback: T): T => {
  const value = settings[key]?.value;
  return (value === undefined || value === null ? fallback : value) as T;
};

// A missing key means the control was never rendered, so keep the built-in
// default. A key that is present but empty means the user cleared every box.
const readFlags = <T extends string>(
  settings: ClaySettings,
  key: string,
  options: readonly T[],
  fallback: readonly T[] = [],
): T[] => {
  const entry = settings[key];
  if (entry === undefined) return [...fallback];
  const flags = Array.isArray(entry.value) ? entry.value : [];
  return options.filter((_, index) => Boolean(flags[index]));
};

const toBoundedInt = (
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number => {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, parsed))
    : fallback;
};

/** Convert a Clay config page response into an AppConfig. */
export const parseClayConfig = (settings: ClaySettings): AppConfig => ({
  selectedCategoryNames: readFlags(
    settings,
    "UserCategories",
    availableCategories,
    defaultCategories,
  ),
  selectedSectionNames: readFlags(
    settings,
    "UserSections",
    availableSections,
    availableSections,
  ),
  selectedAdditionalFeeds: readFlags(
    settings,
    "AdditionalFeeds",
    additionalFeeds,
  ),
  newsRefreshPinSetting: Boolean(
    readValue<boolean[]>(settings, "UserTimelinePins", [])[0],
  ),
  selectedTextSize: toBoundedInt(
    readValue(settings, "UserTextSize", 0),
    0,
    3,
    0,
  ),
  selectedInterfaceLanguage: String(
    readValue(settings, "UserInterfaceLanguage", "") ?? "",
  ),
  selectedContentLanguage: String(
    readValue(settings, "UserContentLanguage", "") ?? "",
  ),
  selectedMaxStoryCount: toBoundedInt(
    readValue(settings, "UserMaxStories", defaultMaxStories),
    1,
    50,
    defaultMaxStories,
  ),
  isTensionIndexEnabled: Boolean(readValue(settings, "ShowTensionIndex", true)),
});

/** The "Clear Cache On Save" options that were ticked. */
export const parseClearCacheFlags = (
  settings: ClaySettings,
): ClearCacheOption[] =>
  readFlags(settings, "ClearCacheOnSave", CLEAR_CACHE_OPTIONS);

// Legacy per-key storage used before the config was unified into a single blob.
const LEGACY_KEYS: (keyof AppConfig)[] = [
  "selectedAdditionalFeeds",
  "newsRefreshPinSetting",
  "selectedTextSize",
  "selectedInterfaceLanguage",
  "selectedContentLanguage",
  "selectedMaxStoryCount",
  "selectedSectionNames",
  "selectedCategoryNames",
  "isTensionIndexEnabled",
];

const migrateFromLegacyStorage = (): AppConfig => {
  const migrated: Partial<AppConfig> = {};
  for (const key of LEGACY_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      (migrated as Record<string, unknown>)[key] = JSON.parse(raw);
    } catch {}
  }
  const config = { ...CONFIG_DEFAULTS, ...migrated };
  if (Object.keys(migrated).length > 0) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    log.info("Migrated config from per-key storage to single blob");
  }
  return config;
};

export const getAppConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    // Merge with defaults so keys added in later versions still resolve.
    return stored
      ? { ...CONFIG_DEFAULTS, ...JSON.parse(stored) }
      : migrateFromLegacyStorage();
  } catch (err) {
    log.warn(
      "Failed to read config, using defaults",
      err instanceof Error ? err.message : String(err),
    );
    return { ...CONFIG_DEFAULTS };
  }
};

export const saveAppConfig = (config: AppConfig): void => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    log.debug("Config saved");
  } catch (err) {
    log.error(
      "Failed to save config",
      err instanceof Error ? err.message : String(err),
    );
  }
};

/**
 * Defaults handed to the Clay config page via `localStorage["clay-settings"]`.
 * @param debugMode Whether debug mode is enabled
 */
export const generateClaySettings = (
  debugMode: boolean,
): Record<string, unknown> => {
  const config = getAppConfig();

  return {
    UserCategories: availableCategories.map((name) =>
      config.selectedCategoryNames.includes(name),
    ),
    UserSections: availableSections.map((name) =>
      config.selectedSectionNames.includes(name),
    ),
    AdditionalFeeds: additionalFeeds.map((name) =>
      config.selectedAdditionalFeeds.includes(name),
    ),
    UserInterfaceLanguage: config.selectedInterfaceLanguage,
    UserContentLanguage: config.selectedContentLanguage,
    UserMaxStories: config.selectedMaxStoryCount,
    UserTextSize: String(config.selectedTextSize),
    UserTimelinePins: [config.newsRefreshPinSetting],
    ClearCacheOnSave: CLEAR_CACHE_OPTIONS.map(() => false),
    DebugMode: debugMode,
    ShowTensionIndex: config.isTensionIndexEnabled,
  };
};
