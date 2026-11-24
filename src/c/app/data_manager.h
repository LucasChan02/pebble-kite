#pragma once
#include <pebble.h>
typedef enum {
    DATA_RESOURCE_PRIMARY_STORY_OPTIONS,
    DATA_RESOURCE_PRIMARY_STORY_TITLE,
    DATA_RESOURCE_PRIMARY_STORY_TEXT,
    DATA_RESOURCE_CATEGORIES,
    DATA_RESOURCE_STORY_DETAILS,
    DATA_RESOURCE_STORY_DETAIL_OPTIONS,
    DATA_RESOURCE_STORY_DETAIL_TITLE,
    DATA_RESOURCE_STORY_DETAIL_TEXT,
    DATA_RESOURCE_ACTIVE_DETAIL_SOURCE_OPTIONS,
    DATA_RESOURCE_QR_CODE,
} DataResource;
typedef struct {
    const char *category_name;
    const char *story_title;
    const char *story_id;
    const char *article_link;
} DataContext;
typedef void *DataRegistrationHandle;
void data_manager_init(void);
void data_manager_deinit(void);
DataRegistrationHandle data_manager_register_window_requirements(Window *window, DataResource *resources,
                                                                 size_t resource_count);
void data_manager_unregister_window_requirements(DataRegistrationHandle handle);
void data_manager_request_resource(DataResource resource, const DataContext *context);
void data_manager_refresh_window_data(DataRegistrationHandle handle);
