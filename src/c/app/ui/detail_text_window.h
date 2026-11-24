#pragma once
#include "../data_manager.h"
#include "../detail_types.h"
#include <pebble.h>
typedef void (*DetailTextSelectCallback)(void);
void detail_text_window_ui_init(Window **window, char *(*get_title)(void), char *(*get_text)(void),
                                const char *detail_type, DataResource resource_requirements[],
                                DetailTextSelectCallback on_select);
void detail_text_window_ui_init_with_default_handlers(Window **window, DetailType detail_type, bool set_title_on_init);
void detail_text_window_ui_update_with_sources_check(Window **window);
void detail_text_window_ui_deinit(Window **window);
void detail_text_window_ui_update(Window **window);
void detail_text_window_ui_set_select_handler(Window **window, void (*on_select)(void));
