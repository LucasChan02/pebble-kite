/*
 * Message key registry for package.json -> pebble.messageKeys.
 *
 * Clay expands a checkbox group into sequential keys (option N -> messageKey +
 * N), so a group's ID is also a claim on the IDs that follow it. CONFIG_KEYS
 * therefore declares each band as a base ID plus the number of option slots it
 * needs, and the generator proves the bands never overlap.
 *
 * UserCategories used to sit at 10000 with room for exactly 200 options. When
 * Kagi's category list grew past 200, that band ran into UserSections at 10200
 * and started overwriting the section toggles, which made the tail of the
 * category list permanently stuck on. Each band below now reserves several
 * times the options it actually uses.
 *
 * Config keys   11000-12499   fixed hand-designed bands
 * Protocol keys 20000-        assigned in list order
 *
 * Protocol keys that already exist keep their ID, including the legacy
 * 10501-10537 block, so the watch <-> phone wire format never shifts.
 */

const CONFIG_KEYS = [
  { name: "UserCategories", id: 11000, capacity: 1000 },
  { name: "UserSections", id: 12000, capacity: 100 },
  { name: "AdditionalFeeds", id: 12100, capacity: 100 },
  { name: "UserTimelinePins", id: 12200, capacity: 100 },
  { name: "ClearCacheOnSave", id: 12300, capacity: 100 },
  { name: "UserInterfaceLanguage", id: 12400, capacity: 1 },
  { name: "UserContentLanguage", id: 12401, capacity: 1 },
  { name: "UserMaxStories", id: 12402, capacity: 1 },
  { name: "UserTextSize", id: 12403, capacity: 1 },
  { name: "ShowTensionIndex", id: 12404, capacity: 1 },
  { name: "DebugMode", id: 12405, capacity: 1 },
];

const PROTOCOL_KEY_BASE = 20000;

const PROTOCOL_KEYS = [
  "additionalFeedsCount",
  "articleDomain",
  "articleDomains",
  "availableDetailTypes",
  "categoryName",
  "categoryNamePage",
  "chunk",
  "detailContent",
  "detailContentType",
  "detailHasSources",
  "detailKey",
  "detailType",
  "error",
  "interfaceStrings",
  "isDebugMode",
  "loadingCurrent",
  "loadingMax",
  "logLevel",
  "logMessage",
  "logTag",
  "nextChunk",
  "nextPage",
  "page",
  "qrData",
  "qrSize",
  "sessionId",
  "shortData",
  "state",
  "storyId",
  "storyReadStatuses",
  "storySummary",
  "storyTitle",
  "storyTitles",
  "tensionIndex",
  "tensionReason",
  "textSize",
  "type",
];

module.exports = { CONFIG_KEYS, PROTOCOL_KEY_BASE, PROTOCOL_KEYS };
