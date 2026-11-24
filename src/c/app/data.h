#pragma once
#include <pebble.h>
typedef struct {
    char **categories;
    uint16_t categories_count;
} CategoriesData;
typedef struct {
    int tension_index;
    char *tension_reason;
} TensionData;
typedef struct {
    char *selected_category;
    int selected_category_index;
    char **story_titles;
    bool *stories_read;
    uint16_t story_titles_count;
} StoryListData;
typedef struct {
    char *story_id;
    char *story_full_title;
    char *story_short_summary;
} StoryData;
typedef struct {
    char **available_details;
    uint16_t available_details_count;
} AvailableDetailsData;
typedef struct {
    char *detail_type;
    char **detail_options;
    uint16_t detail_options_count;
} DetailListData;
typedef struct {
    char *detail_title;
    char *detail_text;
} DetailTextData;
typedef struct {
    bool has_sources;
    char **sources;
    uint16_t sources_count;
} DetailSourcesData;
typedef struct {
    uint8_t *qr_code_chunks;
    uint16_t qr_code_chunks_count;
    uint8_t qr_size;
} QRCodeData;
void data_init(void);
void data_deinit(void);
void set_session_id(const char *session_id);
const char *get_session_id(void);
void clear_level_4_selected_detail(void);
void clear_level_3_available_details(void);
void clear_level_2_story_view(void);
void set_additional_feeds_count(uint8_t count);
uint8_t get_additional_feeds_count(void);
void push_local_categories(char *categories_string);
const CategoriesData *get_categories_data(void);
bool categories_loaded(void);
void clear_categories_data(void);
void set_tension_index(int index);
void set_tension_reason(const char *reason);
const TensionData *get_tension_index_data(void);
void set_selected_category(char *category_name);
void set_selected_category_index(int index);
void push_story_titles(char *story_titles_string);
const StoryListData *get_story_list_data(void);
void clear_story_list_data(void);
void set_story_id(char *story_id);
void set_story_full_title(char *story_full_title);
void set_story_short_summary(char *story_short_summary);
void set_story_read(uint16_t index, bool story_read);
void push_story_read_statuses(char *stories_read_string);
const StoryData *get_story_data(void);
void clear_story_data(void);
void set_available_details(char *details_string);
const AvailableDetailsData *get_available_details_data(void);
void clear_available_details_data(void);
void set_detail_type(char *type, void (*callback)(void));
void set_detail_options(char *options_string, void (*callback)(void));
const DetailListData *get_detail_list_data(void);
void clear_detail_list_data(void);
void set_detail_title(char *title, void (*callback)(void));
void set_detail_text(char *text, void (*callback)(void));
const DetailTextData *get_detail_text_data(void);
void clear_detail_text_data(void);
void set_detail_has_sources(bool has_sources, void (*callback)(void));
void set_detail_sources(char *sources, void (*callback)(void));
const DetailSourcesData *get_detail_sources_data(void);
void clear_detail_sources_data(void);
void push_qr_code_chunk(uint8_t *chunk, uint16_t chunk_length);
void set_qr_size(uint8_t size);
const QRCodeData *get_qr_code_data(void);
bool qr_code_loaded(void);
void clear_qr_code_data(void);
