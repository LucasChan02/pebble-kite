#pragma once
#include <pebble.h>
bool send_get_category_names(int8_t page);
bool send_get_story_titles(int8_t page, char *category_name, bool short_data);
bool send_get_short_summary(char *category_name, char *story_title);
bool send_get_tension_index_reason(void);
bool send_get_qr_code_bitmap(char *article_domain);
bool send_get_next_qr_code_bitmap(int8_t chunk);
bool send_get_story_available_details(char *category_name, char *story_id);
bool send_get_story_detail(char *story_detail);
bool send_get_current_detail_text(char *type, char *key);
bool send_get_story_detail_sources(char *type, char *key);
bool send_debug_log(int32_t level, const char *tag, const char *message);
bool send_debug_notify(const char *title, const char *message);
bool send_mark_story_read(const char *story_id);
void communication_init(void);
void communication_deinit(void);
