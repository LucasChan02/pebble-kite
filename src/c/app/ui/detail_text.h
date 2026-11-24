#pragma once
#include "../data_manager.h"
#include <pebble.h>
Window *detail_text_create(Window **window, char *(*get_title)(void), char *(*get_text)(void), const char *detail_type,
                           DataResource *resources, size_t resource_count, DataRegistrationHandle *handle);
Window *detail_text_create_with_unload(Window **window, char *(*get_title)(void), char *(*get_text)(void),
                                       const char *detail_type, DataResource *resources, size_t resource_count,
                                       DataRegistrationHandle *handle, void (*on_unload)(void));
void detail_text_destroy(Window *window);
void detail_text_update(Window *window);
void detail_text_set_select_handler(Window *window, void (*on_select)(void));
void detail_text_set_scroll_handler(Window *window, ScrollLayerCallback callback);
