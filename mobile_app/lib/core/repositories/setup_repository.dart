import 'package:dio/dio.dart';

class SetupRepository {
  final Dio _dio;

  SetupRepository(this._dio);

  Future<bool> registerStation(String machineId, String location) async {
    try {
      final response = await _dio.post('/setup/register', data: {
        'machine_id': machineId,
        'location': location,
      });
      return response.data['success'] == true;
    } catch (e) {
      // In a real app we might want to log this or rethrow specifically
      rethrow;
    }
  }
}
