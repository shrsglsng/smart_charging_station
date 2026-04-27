import 'package:dio/dio.dart';
import '../models/slot_model.dart';

class SlotRepository {
  final Dio _dio;

  SlotRepository(this._dio);

  Future<List<SlotModel>> getSlotsState() async {
    try {
      final response = await _dio.get('/slots/state');
      final List<dynamic> data = response.data;
      return data.map((json) => SlotModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> startSession(String phoneNumber, String pin) async {
    try {
      final response = await _dio.post('/session/start', data: {
        'phone_number': phoneNumber,
        'pin': pin,
      });
      return response.data['success'] == true;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> assignSlot(int slotNumber, String phoneNumber, String pin) async {
    try {
      final response = await _dio.post('/slots/assign', data: {
        'slot_number': slotNumber,
        'phone_number': phoneNumber,
        'pin': pin,
      });
      return response.data['success'] == true;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> simulateDoorLock(int slotNumber) async {
    try {
      final response = await _dio.post('/hardware/door-state', data: {
        'slot_number': slotNumber,
        'is_closed': true,
      });

      final action = response.data['action'];
      if (action == 'UNLOCK_DOOR') {
        // This simulates the rogue user scenario
        throw Exception('SECURITY: Unauthorized closure! Door was automatically UNLOCKED.');
      }

      return action == 'ENABLE_CHARGING';
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> retrieveSession(String phoneNumber, String pin) async {
    try {
      final response = await _dio.post('/session/retrieve', data: {
        'phone_number': phoneNumber,
        'pin': pin,
      });
      // Backend returns { success: true, slot_number: X }
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> recoverUnlock(String phoneNumber, int slotNumber) async {
    try {
      final response = await _dio.post('/session/recover-unlock', data: {
        'phone_number': phoneNumber,
        'slot_number': slotNumber,
      });
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}
