#pragma once
#include <pebble.h>
typedef enum {
    NAV_TIER_1_CATEGORIES,        // Categories list
    NAV_TIER_2_STORY_TITLES,      // Story titles list
    NAV_TIER_2_STORY_SUMMARY,     // Story summary text
    NAV_TIER_3_AVAILABLE_DETAILS, // Available details list (routing decision point)
    NAV_TIER_4_DETAIL_LIST,       // Detail options list
    NAV_TIER_4_DETAIL_TEXT,       // Detail text content
    NAV_TIER_5_SOURCES_LIST,      // Sources list
    NAV_TIER_6_QR_CODE,           // QR code display (terminal)
} NavigationTier;
typedef enum {
    DETAIL_CONTENT_TYPE_NONE,
    DETAIL_CONTENT_TYPE_LIST,    // Has multiple options to choose from
    DETAIL_CONTENT_TYPE_TEXT,    // Has single text content
    DETAIL_CONTENT_TYPE_SOURCES, // Has sources (from text level)
} DetailContentType;
void navigation_proceed(NavigationTier current_tier, const char *detail_type, bool has_list, bool has_text,
                        bool has_sources);
void navigation_open_story_titles(const char *category, int category_index);
void navigation_open_story_summary(const char *category, const char *story_title, int index);
void navigation_open_available_details(const char *category, const char *story_id);
void navigation_open_detail_content(const char *detail_type);
void navigation_open_detail_text(const char *detail_type, const char *detail_title);
void navigation_open_sources(const char *detail_type, const char *detail_title);
void navigation_open_qr_code(const char *source_domain);
NavigationTier navigation_get_current_tier(void);
