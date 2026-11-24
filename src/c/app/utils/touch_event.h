#pragma once
#include <pebble.h>
typedef void (*TouchEventCallback)(void *context);
void touch_event_subscribe(TouchEventCallback on_swipe_up, TouchEventCallback on_swipe_down,
                           TouchEventCallback on_swipe_left, TouchEventCallback on_swipe_right, void *context);
void touch_event_unsubscribe(void);
