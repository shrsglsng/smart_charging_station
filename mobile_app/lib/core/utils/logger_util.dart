import 'dart:developer' as dev;
import 'package:flutter/foundation.dart';

enum LogLevel { info, debug, error, warning }

class AppLogger {
  static void log(String message, {LogLevel level = LogLevel.info, Object? error, StackTrace? stackTrace}) {
    if (kReleaseMode) return;

    final timestamp = DateTime.now().toString().split('.').first;
    final levelStr = level.name.toUpperCase();
    final formattedMessage = '$timestamp [$levelStr]: $message';

    switch (level) {
      case LogLevel.info:
        dev.log(formattedMessage, name: 'APP_INFO');
        break;
      case LogLevel.debug:
        dev.log(formattedMessage, name: 'APP_DEBUG');
        break;
      case LogLevel.warning:
        dev.log(formattedMessage, name: 'APP_WARNING');
        break;
      case LogLevel.error:
        dev.log(formattedMessage, name: 'APP_ERROR', error: error, stackTrace: stackTrace);
        break;
    }
    
    // Also print to console for direct visibility in terminal
    debugPrint(formattedMessage);
  }

  static void info(String message) => log(message, level: LogLevel.info);
  static void debug(String message) => log(message, level: LogLevel.debug);
  static void warn(String message) => log(message, level: LogLevel.warning);
  static void error(String message, [Object? error, StackTrace? stackTrace]) 
    => log(message, level: LogLevel.error, error: error, stackTrace: stackTrace);
}
