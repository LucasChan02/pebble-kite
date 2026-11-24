#pragma once
#include <pebble.h>
void splash_screen_init(void);
void splash_screen_deinit(void);
void splash_screen_dismiss(void);
bool splash_screen_is_showing(void);
void splash_screen_set_loading_progress(uint16_t current, uint16_t max);
