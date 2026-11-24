#pragma once
#include "localization/localization.h"
#include <pebble.h>
typedef enum {
    DETAIL_TYPE_PRIMARY_STORY,
    DETAIL_TYPE_INDUSTRY_IMPACT,
    DETAIL_TYPE_HUMANITARIAN_IMPACT,
    DETAIL_TYPE_TALKING_POINTS,
    DETAIL_TYPE_PERSPECTIVES,
    DETAIL_TYPE_QNA,
    DETAIL_TYPE_TRAVEL_ADVISORY,
    DETAIL_TYPE_BACKGROUND,
    DETAIL_TYPE_ARTICLES,
    DETAIL_TYPE_TECHNICAL_DETAILS,
    DETAIL_TYPE_TIMELINE,
    DETAIL_TYPE_DID_YOU_KNOW,
    DETAIL_TYPE_QUOTE,
    DETAIL_TYPE_TENSION_INDEX,
    DETAIL_TYPE_INTERNATIONAL_REACTIONS,
    DETAIL_TYPE_USER_ACTION_ITEMS,
    DETAIL_TYPE_SCIENTIFIC_SIGNIFICANCE,
    DETAIL_TYPE_PERFORMANCE_STATISTICS,
    DETAIL_TYPE_DETAIL_SOURCES,
} DetailType;
typedef struct {
    DetailType detail_type;
    const char *api_name;
    StringId string_id;
    bool has_list;
    bool has_text;
    const char *list_key;
} DetailTypeInfo;
const DetailTypeInfo *detail_type_from_api_name(const char *api_name);
const DetailTypeInfo *detail_type_from_type(DetailType type);
const char *detail_type_get_display_name(const char *api_name);
const char *detail_type_get_display_name_from_type(DetailType type);
DetailType detail_type_get_type(const char *api_name);
const char *detail_type_get_api_name(DetailType type);
int detail_type_get_count(void);
const DetailTypeInfo *detail_type_get_by_index(int index);
