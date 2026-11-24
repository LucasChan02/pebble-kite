#pragma once
#include "strings-def.h"
#include <pebble.h>
void localization_init(void);
void localization_deinit(void);
void localization_set_strings(const char *strings_json);
const char *localization_get_string(StringId string_id);
const char *localization_get_category_by_index(uint8_t index);
