#pragma once
#include <pebble.h>
uint16_t page_start(uint16_t section, uint16_t section_size);
uint16_t page_end(uint16_t section, uint16_t section_size, uint16_t total);
uint16_t page_count(uint16_t section, uint16_t section_size, uint16_t total);
bool has_next_section(uint16_t section, uint16_t section_size, uint16_t total);
bool has_prev_section(uint16_t section);
