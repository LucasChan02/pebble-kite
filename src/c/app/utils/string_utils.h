#pragma once
#include <pebble.h>
char *string_duplicate(const char *src);
char *string_trim(char *str);
int8_t string_split_to_array(char **array, int8_t current_count, int8_t max_capacity, char *string,
                             const char *delimiter);
