import 'package:dio/dio.dart';

class ErrorUtil {
  static String formatError(dynamic error) {
    if (error is DioException) {
      if (error.response != null) {
        final data = error.response?.data;
        // The backend now provides user-friendly "message" or "error" fields
        if (data is Map) {
          if (data.containsKey('message')) return data['message'];
          if (data.containsKey('error')) return data['error'];
        }
        
        // Handle specific status codes if no message is provided
        switch (error.response?.statusCode) {
          case 400:
            return 'Invalid request details. Please check your input.';
          case 401:
            return 'Unauthorized access. Please try again.';
          case 404:
            return 'Resource not found or Station is offline.';
          case 500:
            return 'Server error. Please contact support.';
          default:
            return 'Server returned error: ${error.response?.statusCode}';
        }
      }
      
      // Connection/Network errors
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timed out. Please check your network.';
        case DioExceptionType.connectionError:
          return 'No internet connection or server is unreachable.';
        default:
          return 'Network error occurred. Please try again.';
      }
    }
    
    // Generic error fallback
    return error?.toString() ?? 'An unknown error occurred';
  }
}
