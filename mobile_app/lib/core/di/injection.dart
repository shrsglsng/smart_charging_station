import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../repositories/slot_repository.dart';
import '../repositories/setup_repository.dart';
import '../utils/logger_util.dart';

final sl = GetIt.instance;

Future<void> initInjection() async {
  // SharedPreferences
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton<SharedPreferences>(() => sharedPreferences);

  // Dio
  sl.registerLazySingleton<Dio>(() {
    final dio = Dio(
      BaseOptions(
        baseUrl: dotenv.get('API_BASE_URL'),
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 3),
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final machineId = sl<SharedPreferences>().getString('machine_id');
          if (machineId != null) {
            options.headers['x-machine-id'] = machineId;
          }
          return handler.next(options);
        },
      ),
    );

    // Custom logging interceptor
    dio.interceptors.add(
      InterceptorsWrapper(
        onResponse: (response, handler) {
          AppLogger.debug('API RESPONSE: [${response.statusCode}] ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (error, handler) {
          AppLogger.error('API ERROR: [${error.response?.statusCode}] ${error.requestOptions.path} - ${error.message}');
          return handler.next(error);
        },
      ),
    );

    return dio;
  });

  // Repositories
  sl.registerLazySingleton<SlotRepository>(() => SlotRepository(sl<Dio>()));
  sl.registerLazySingleton<SetupRepository>(() => SetupRepository(sl<Dio>()));
}
