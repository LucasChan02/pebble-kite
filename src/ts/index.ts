import { ClayConstructor, Clay as ClayInstance } from "../lib/Clay";
import { buildClayConfig } from "./clayConfig";
// @ts-ignore
const Clay: ClayConstructor = require("@rebble/clay");

import {
  AppConfig,
  ClaySettings,
  ClearCacheOption,
  generateClaySettings,
  getAppConfig,
  parseClayConfig,
  parseClearCacheFlags,
  saveAppConfig,
} from "./config";
import {
  healthRequest,
  possibleCategoriesRequest,
} from "./server/request/metaRequests";
import * as handlers from "./handlers";
import {
  additionalFeeds,
  availableCategories,
  defaultCategories,
  setAvailableCategories,
  StoryDetailEnum,
} from "./types";
import {
  createLogger,
  initDebugMode,
  setDebugMode,
  isDebugMode,
} from "../lib/logger";
import {
  filterInterfaceStringOptionals,
  flattenInterfaceStrings,
  getInterfaceStrings,
} from "./localization";
import { setServerLang } from "./server/localeManager";
import { updateCachedBatchInfo } from "./server/cache";
import { batchesRequest } from "./server/request/batchRequests";
import * as timeline from "./timeline";
import {
  sendAppMessageWithSession,
  setSessionId,
} from "./sessionBasedAppMessage";
import { getCategoryBatchMap } from "./api";

const log = createLogger("KNJS");

// The percentage sent is arbitrary based on what seems right for how long each
// step takes, and is only meant to give a rough sense of progress.
const LOADING_MILESTONES = {
  READY: 5,
  POSSIBLE_CATEGORIES: 15,
  DEBUG_MODE: 25,
  BATCH_INFO: 40,
  CONFIG: 55,
  INTERFACE_STRINGS: 65,
  TENSION: 95,
} as const;

// Only ever moves forwards, so the splash bar never jumps back.
const sendStartupLoadingState = (() => {
  let lastSent = 0;
  return async (current: number) => {
    if (current <= lastSent) return;
    lastSent = current;
    return sendAppMessageWithSession({
      type: "loading_state",
      loadingCurrent: current,
      loadingMax: 100,
    });
  };
})();

// Mutable Clay instance that is updated based on runtime fetches of Kagi News data
let clay: ClayInstance = new Clay(buildClayConfig(defaultCategories), null, {
  autoHandleEvents: false,
});

const refreshPossibleCategories = async (): Promise<void> => {
  const result = await possibleCategoriesRequest();
  if (result.names.length > 0) {
    setAvailableCategories(result.names, result.displayNamesMap);
    log.info(
      `Fetched ${availableCategories.length} categories from metadata API`,
    );
  } else {
    setAvailableCategories(defaultCategories);
    log.error(
      "Failed to fetch categories from metadata API, using fallback list",
    );
  }
  clay = new Clay(buildClayConfig(availableCategories), null, {
    autoHandleEvents: false,
  });
};

const sendInterfaceStrings = async (
  config: AppConfig,
  categoryKeys: string[],
): Promise<void> => {
  const strings = flattenInterfaceStrings(
    filterInterfaceStringOptionals({
      strings: getInterfaceStrings(config.selectedInterfaceLanguage),
      sectionKeys: config.selectedSectionNames,
      categoryKeys,
      featureKeys: config.selectedAdditionalFeeds,
      lang: config.selectedInterfaceLanguage,
    }),
  );
  await sendAppMessageWithSession({
    type: "send_interface_strings",
    interfaceStrings: JSON.stringify(strings),
  });
};

// Push everything the watch needs before it can ask for categories.
const applyConfig = async (config: AppConfig): Promise<void> => {
  setServerLang(config.selectedContentLanguage);
  handlers.setMaxStoryCount(config.selectedMaxStoryCount);
  handlers.setSelectedSections(config.selectedSectionNames);
  handlers.setSelectedCategories(config.selectedCategoryNames);
  handlers.setAdditionalFeeds(...config.selectedAdditionalFeeds);

  await sendAppMessageWithSession({
    type: "set_text_size",
    textSize: config.selectedTextSize,
  });
  await sendInterfaceStrings(config, config.selectedCategoryNames);
};

// Load stories, then tell the watch data is ready. update_categories is sent
// even when the fetch fails so the watch can never be stranded on the splash
// screen, which is what a rejected updateCategories used to cause.
const loadCategoriesAndNotifyWatch = async (
  config: AppConfig,
  onProgress?: (completed: number, total: number) => void,
): Promise<void> => {
  try {
    await handlers.handleUpdateCategories(onProgress);
  } catch (err) {
    log.error(
      "Failed to load categories",
      err instanceof Error ? err.message : String(err),
    );
  }

  // Re-send with only the categories that have stories today; empty categories
  // (e.g. "Bitcoin" on a slow news day) would otherwise take a localization
  // slot and shift every later category's display name by one position.
  const actualCategoryNames = getCategoryBatchMap()
    .categorizedStories.map((categorized) => categorized.category.name)
    .filter((name) => !(additionalFeeds as readonly string[]).includes(name));

  try {
    await sendInterfaceStrings(config, actualCategoryNames);
  } catch (err) {
    log.warn("Failed to send interface strings", err);
  }

  await handlers
    .updateTensionIndex(config.isTensionIndexEnabled)
    .catch((err) => log.warn("Failed to update tension index", err));

  log.info("Notifying watch that data is ready");
  await sendAppMessageWithSession({
    type: "update_categories",
    state: "success",
  });
};

// Drop cached network data whenever Clay closes so a settings change is never
// served stale data, plus whatever the user asked to clear.
const clearCachesOnSave = async (
  selected: ClearCacheOption[],
): Promise<void> => {
  await handlers.clearNetworkCache({ repopulateBatchId: true });

  if (selected.includes("Clear full cache")) {
    await handlers.clearFullCache();
    return;
  }
  if (selected.includes("Clear timeline pin memory")) handlers.clearPinCache();
  if (selected.includes("Clear read stories memory")) {
    handlers.clearReadStoriesCache();
  }
};

Pebble.addEventListener("ready", async () => {
  setSessionId(Date.now().toString());
  initDebugMode();
  log.info("PebbleKit JS ready");

  await sendAppMessageWithSession({ type: "provide_session_id" });
  await sendStartupLoadingState(LOADING_MILESTONES.READY);

  await refreshPossibleCategories();
  await sendStartupLoadingState(LOADING_MILESTONES.POSSIBLE_CATEGORIES);

  await sendAppMessageWithSession({
    type: "set_debug_mode",
    isDebugMode: isDebugMode() ? 1 : 0,
  });
  await sendStartupLoadingState(LOADING_MILESTONES.DEBUG_MODE);

  try {
    const health = await healthRequest();
    if (!health.health) {
      log.warn("Kagi News API is unhealthy");
      return;
    }
    log.info("Kagi News API is healthy");

    const batchInfo = await batchesRequest();
    log.info(
      `Current batch ID: ${batchInfo.id}, created at ${batchInfo.createdAt}`,
    );
    updateCachedBatchInfo(batchInfo);
    await sendStartupLoadingState(LOADING_MILESTONES.BATCH_INFO);

    const config = getAppConfig();

    if (config.newsRefreshPinSetting) {
      timeline.pushNewsRefreshPinToTimeline();
    }

    await applyConfig(config);
    await sendStartupLoadingState(LOADING_MILESTONES.INTERFACE_STRINGS);

    // Categories must update before tension; both finish before the watch is told
    await loadCategoriesAndNotifyWatch(config, (completed, total) => {
      const progress =
        LOADING_MILESTONES.INTERFACE_STRINGS +
        Math.round(
          (completed / total) *
            (LOADING_MILESTONES.TENSION - LOADING_MILESTONES.INTERFACE_STRINGS),
        );
      void sendStartupLoadingState(progress);
    });
    await sendStartupLoadingState(LOADING_MILESTONES.TENSION);
  } catch (err) {
    log.error("Something went wrong with initial setup", err);
  }
});

Pebble.addEventListener("showConfiguration", async () => {
  try {
    await refreshPossibleCategories();
    const claySettings = generateClaySettings(isDebugMode());
    log.debug("Generated Clay settings:", claySettings);
    localStorage.setItem("clay-settings", JSON.stringify(claySettings));
    Pebble.openURL(clay.generateUrl());
  } catch (err) {
    log.error("Failed to open Clay configuration", err);
  }
});

// @ts-ignore
Pebble.addEventListener("webviewclosed", async (event: any) => {
  if (!event?.response) return;

  // Read settings by messageKey NAME rather than by numeric AppMessage key.
  // Clay expands a checkbox group into sequential numeric keys, so reading by
  // offset silently corrupts the config as soon as two key bands overlap.
  const raw: ClaySettings = clay.getSettings(event.response, false);
  log.debug("Clay settings received:", JSON.stringify(raw));

  const config = parseClayConfig(raw);
  setDebugMode(Boolean(raw.DebugMode?.value));
  // Persist before anything that can fail, so a network problem can never
  // discard the changes the user just made.
  saveAppConfig(config);
  log.info("Configuration saved");

  try {
    await clearCachesOnSave(parseClearCacheFlags(raw));
  } catch (err) {
    log.warn("Failed to clear caches on save", err);
  }

  try {
    if (config.newsRefreshPinSetting) {
      timeline.pushNewsRefreshPinToTimeline();
    }
    // Restart the watch so new fonts, text size and strings take effect, then
    // replay the startup pipeline against the new settings.
    await sendAppMessageWithSession({ type: "restart_app" });
    await sendAppMessageWithSession({
      type: "set_debug_mode",
      isDebugMode: isDebugMode() ? 1 : 0,
    });
    await applyConfig(config);
    await loadCategoriesAndNotifyWatch(config);
  } catch (err) {
    log.error(
      "Failed to apply configuration",
      err instanceof Error ? err.message : String(err),
    );
  }
});

const replyError = (type: string, error: string) =>
  sendAppMessageWithSession({ type, state: "error", error });

Pebble.addEventListener("appmessage", async (event) => {
  if (!event.payload || !("type" in event.payload)) return;
  const payload: any = event.payload;

  switch (payload.type) {
    case "get_category_names":
      handlers.handleGetCategoryNames({ page: payload.page });
      break;
    case "get_story_titles":
      if ("categoryName" in payload) {
        handlers.handleGetStoryTitles({
          page: payload.page,
          categoryName: payload.categoryName,
          shortData: payload.shortData === 1,
        });
      } else {
        replyError(
          "get_story_titles",
          "categoryName required for get_story_titles but none provided",
        );
      }
      break;
    case "get_short_summary":
      if ("storyTitle" in payload) {
        handlers.handleGetShortSummary({
          categoryName: payload.categoryName,
          storyTitle: payload.storyTitle,
        });
      } else {
        replyError(
          "get_short_summary",
          "storyTitle required for get_short_summary but none provided",
        );
      }
      break;
    case "get_available_details":
      if ("storyId" in payload) {
        handlers.handleGetAvailableDetails({
          categoryName: payload.categoryName,
          storyId: payload.storyId,
        });
      } else {
        replyError(
          "get_available_details",
          "storyId required for get_available_details but none provided",
        );
      }
      break;
    case "get_story_detail":
      if ("detailType" in payload) {
        handlers.handleGetStoryDetail({
          detailType: payload.detailType,
          detailKey: payload.detailKey,
        });
      } else {
        replyError(
          "get_story_detail",
          "detailType required for get_story_detail but none provided",
        );
      }
      break;
    case "get_story_detail_sources":
      if (!("detailType" in payload)) {
        replyError(
          "get_story_detail_sources",
          "detailType required for get_story_detail_sources but none provided",
        );
      } else if (payload.detailType === StoryDetailEnum.Quote) {
        handlers.handleGetArticleDomainForQuote();
      } else {
        handlers.handleGetArticleDomainsFromContent({
          detailType: payload.detailType,
          detailKey: payload.detailKey,
        });
      }
      break;
    case "get_qr_code_bitmap":
      log.debug("Received get_qr_code_bitmap request", payload);
      if (!("articleDomain" in payload)) {
        replyError(
          "get_qr_code_bitmap",
          "articleDomain required for get_qr_code_bitmap but none provided",
        );
      } else if (payload.articleDomain === "Type_Quote") {
        handlers.handleUpdateQrCodeForQuote();
      } else {
        handlers.handleUpdateQrCode({ domain: payload.articleDomain });
      }
      break;
    case "get_next_qr_code_bitmap":
      if ("chunk" in payload) {
        handlers.handleGetQrCodeChunk({ chunk: payload.chunk });
      } else {
        replyError(
          "get_next_qr_code_bitmap",
          "chunk required for get_next_qr_code_bitmap but none provided",
        );
      }
      break;
    case "mark_story_read":
      if ("storyId" in payload) {
        handlers.handleAddReadStory(payload.storyId);
      } else {
        replyError(
          "mark_story_read",
          "storyId required for mark_story_read but not provided",
        );
      }
      break;
    case "debug_log": {
      if (
        "logLevel" in payload &&
        "logTag" in payload &&
        "logMessage" in payload
      ) {
        const cLog = createLogger(payload.logTag as string);
        const message = payload.logMessage as string;
        const level = payload.logLevel as number;
        if (level === 0) cLog.debug(message);
        else if (level === 1) cLog.info(message);
        else if (level === 2) cLog.warn(message);
        else if (level === 3) cLog.error(message);
      }
      break;
    }
    case "debug_notify":
      if ("logTag" in payload && "logMessage" in payload) {
        log.notify(payload.logTag as string, payload.logMessage as string);
      }
      break;
    case "tension_index_update":
      handlers.sendFullTensionInfo();
      break;
    default:
    // Do nothing
  }
});
