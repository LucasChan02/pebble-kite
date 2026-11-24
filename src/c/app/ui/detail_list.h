#pragma once
#include "../data_manager.h"
#include <pebble.h>
Window *detail_list_create(Window **window, const char *title, uint16_t (*get_count)(void), char **(*get_items)(void),
                           void (*select_callback)(int));
Window *detail_list_create_with_resources(Window **window, const char *title, uint16_t (*get_count)(void),
                                          char **(*get_items)(void), void (*select_callback)(int),
                                          DataResource *resources, size_t resource_count,
                                          DataRegistrationHandle *handle);
void detail_list_set_is_read_callback(Window *window, bool (*callback)(int index));
