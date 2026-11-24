#pragma once
#include <pebble.h>
void handle_provide_session_id_message(DictionaryIterator *iter);
void handle_update_categories_message(DictionaryIterator *iter);
void handle_get_category_names_message(DictionaryIterator *iter);
void handle_get_story_titles_message(DictionaryIterator *iter);
void handle_get_short_summary_message(DictionaryIterator *iter);
void handle_get_qr_code_bitmap_message(DictionaryIterator *iter);
void handle_get_story_available_details_message(DictionaryIterator *iter);
void handle_get_story_detail_message(DictionaryIterator *iter);
void handle_get_story_detail_sources_message(DictionaryIterator *iter);
void handle_set_debug_mode_message(DictionaryIterator *iter);
void handle_send_interface_strings_message(DictionaryIterator *iter);
void handle_loading_state_message(DictionaryIterator *iter);
void handle_restart_app_message(DictionaryIterator *iter);
void handle_set_text_size_message(DictionaryIterator *iter);
void handle_show_tension_index_message(DictionaryIterator *iter);
void handle_set_emphasis_color_message(DictionaryIterator *iter);
