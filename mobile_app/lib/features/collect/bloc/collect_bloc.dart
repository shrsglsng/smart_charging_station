import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/repositories/slot_repository.dart';
import '../../../core/utils/logger_util.dart';
import '../../../core/utils/error_util.dart';

// Events
abstract class CollectEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class RetrieveSessionRequested extends CollectEvent {
  final String phoneNumber;
  final String pin;

  RetrieveSessionRequested(this.phoneNumber, this.pin);

  @override
  List<Object?> get props => [phoneNumber, pin];
}

class RecoveryUnlockRequested extends CollectEvent {
  final String phoneNumber;
  final int slotNumber;

  RecoveryUnlockRequested(this.phoneNumber, this.slotNumber);

  @override
  List<Object?> get props => [phoneNumber, slotNumber];
}

// State
class CollectState extends Equatable {
  final bool isLoading;
  final String? error;
  final bool isSuccess;
  final int? slotNumber;

  const CollectState({
    this.isLoading = false,
    this.error,
    this.isSuccess = false,
    this.slotNumber,
  });

  CollectState copyWith({
    bool? isLoading,
    String? error,
    bool? isSuccess,
    int? slotNumber,
  }) {
    return CollectState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isSuccess: isSuccess ?? this.isSuccess,
      slotNumber: slotNumber ?? this.slotNumber,
    );
  }

  @override
  List<Object?> get props => [isLoading, error, isSuccess, slotNumber];
}

// BLoC
class CollectBloc extends Bloc<CollectEvent, CollectState> {
  final SlotRepository _slotRepository;

  CollectBloc(this._slotRepository) : super(const CollectState()) {
    on<RetrieveSessionRequested>(_onRetrieveSessionRequested);
    on<RecoveryUnlockRequested>(_onRecoveryUnlockRequested);
  }

  Future<void> _onRetrieveSessionRequested(RetrieveSessionRequested event, Emitter<CollectState> emit) async {
    emit(state.copyWith(isLoading: true, error: null));
    try {
      AppLogger.info('ACTION: Requesting session retrieval for ${event.phoneNumber}');
      final result = await _slotRepository.retrieveSession(event.phoneNumber, event.pin);
      
      if (result['success'] == true) {
        emit(state.copyWith(
          isLoading: false,
          isSuccess: true,
          slotNumber: result['slot_number'],
        ));
        AppLogger.info('BLOC: Session retrieval successful for slot ${result['slot_number']}');
      } else {
        emit(state.copyWith(isLoading: false, error: 'Retrieval failed'));
      }
    } catch (e) {
      AppLogger.error('BLOC: Error during session retrieval', e);
      emit(state.copyWith(isLoading: false, error: ErrorUtil.formatError(e)));
    }
  }

  Future<void> _onRecoveryUnlockRequested(RecoveryUnlockRequested event, Emitter<CollectState> emit) async {
    emit(state.copyWith(isLoading: true, error: null));
    try {
      AppLogger.info('ACTION: Requesting recovery unlock for ${event.phoneNumber} at slot ${event.slotNumber}');
      final result = await _slotRepository.recoverUnlock(event.phoneNumber, event.slotNumber);
      
      if (result['success'] == true) {
        emit(state.copyWith(
          isLoading: false,
          isSuccess: true,
          slotNumber: result['slot_number'],
        ));
        AppLogger.info('BLOC: Recovery unlock successful for slot ${result['slot_number']}');
      } else {
        emit(state.copyWith(isLoading: false, error: 'Recovery failed. Please check your details.'));
      }
    } catch (e) {
      AppLogger.error('BLOC: Error during recovery unlock', e);
      emit(state.copyWith(isLoading: false, error: ErrorUtil.formatError(e)));
    }
  }
}
