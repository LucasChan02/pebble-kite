#pragma once
#include "../data_manager.h"
#include "../detail_types.h"
#include <pebble.h>
typedef void (*DetailListSelectionCallback)(int index);
void detail_list_window_ui_init(Window **window, DataResource resource_requirements[], DetailType detail_type,
                                DetailListSelectionCallback on_select);
void detail_list_window_ui_init_with_default_nav(Window **window, DetailType detail_type);
void detail_list_window_ui_deinit(Window **window);
void detail_list_window_ui_update(Window **window);
void detail_list_window_set_is_read_callback(Window **window, bool (*callback)(int index));
