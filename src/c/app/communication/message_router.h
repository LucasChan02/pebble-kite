#pragma once
#include <pebble.h>
typedef void (*MessageHandler)(DictionaryIterator *iter);
void message_router_init(void);
void message_router_deinit(void);
void message_router_register(const char *type_name, MessageHandler handler);
void message_router_handle_message(DictionaryIterator *iter);
