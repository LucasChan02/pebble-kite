#pragma once
#include <pebble.h>
typedef enum {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO = 1,
    LOG_LEVEL_WARN = 2,
    LOG_LEVEL_ERROR = 3
} DebugLogLevel;
void debug_logger_init(void);
void debug_logger_deinit(void);
void debug_logger_set_enabled(bool enabled);
bool debug_logger_is_enabled(void);
void debug_log(const char *tag, const char *message);
void info_log(const char *tag, const char *message);
void warn_log(const char *tag, const char *message);
void error_log(const char *tag, const char *message);
#ifdef PBL_BW
static char _shared_log_buf[64];
#else
static char _shared_log_buf[96];
#endif
#define DEBUG_LOG(tag, fmt, ...)                                                                                       \
    do                                                                                                                 \
    {                                                                                                                  \
        snprintf(_shared_log_buf, sizeof(_shared_log_buf), fmt, ##__VA_ARGS__);                                        \
        debug_log(tag, _shared_log_buf);                                                                               \
    } while (0)
#define INFO_LOG(tag, fmt, ...)                                                                                        \
    do                                                                                                                 \
    {                                                                                                                  \
        snprintf(_shared_log_buf, sizeof(_shared_log_buf), fmt, ##__VA_ARGS__);                                        \
        info_log(tag, _shared_log_buf);                                                                                \
    } while (0)
#define WARN_LOG(tag, fmt, ...)                                                                                        \
    do                                                                                                                 \
    {                                                                                                                  \
        snprintf(_shared_log_buf, sizeof(_shared_log_buf), fmt, ##__VA_ARGS__);                                        \
        warn_log(tag, _shared_log_buf);                                                                                \
    } while (0)
#define ERROR_LOG(tag, fmt, ...)                                                                                       \
    do                                                                                                                 \
    {                                                                                                                  \
        snprintf(_shared_log_buf, sizeof(_shared_log_buf), fmt, ##__VA_ARGS__);                                        \
        error_log(tag, _shared_log_buf);                                                                               \
    } while (0)
#ifdef RELEASE
#undef DEBUG_LOG
#undef INFO_LOG
#define DEBUG_LOG(tag, fmt, ...)                                                                                       \
    do                                                                                                                 \
    {                                                                                                                  \
    } while (0)
#define INFO_LOG(tag, fmt, ...)                                                                                        \
    do                                                                                                                 \
    {                                                                                                                  \
    } while (0)
#ifdef PBL_PLATFORM_APLITE
#undef WARN_LOG
#undef ERROR_LOG
#define WARN_LOG(tag, fmt, ...)                                                                                        \
    do                                                                                                                 \
    {                                                                                                                  \
    } while (0)
#define ERROR_LOG(tag, fmt, ...)                                                                                       \
    do                                                                                                                 \
    {                                                                                                                  \
    } while (0)
#endif
#endif
