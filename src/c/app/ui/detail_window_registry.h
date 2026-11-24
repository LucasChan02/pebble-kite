#pragma once
#include "../detail_types.h"
#include <pebble.h>
void detail_window_registry_init_list(DetailType detail_type);
void detail_window_registry_init_text(DetailType detail_type);
void detail_window_registry_deinit_list(void);
void detail_window_registry_deinit_text(void);
void detail_window_registry_update_list(void);
void detail_window_registry_update_text(void);
