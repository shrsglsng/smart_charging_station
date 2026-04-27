import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../core/repositories/slot_repository.dart';
import '../../../core/models/slot_model.dart';
import '../../../core/utils/logger_util.dart';
import '../../../core/utils/error_util.dart';

// Events
abstract class StartChargingEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchSlots extends StartChargingEvent {}

class StartPeriodicPolling extends StartChargingEvent {
  final Duration interval;
  StartPeriodicPolling(this.interval);

  @override
  List<Object?> get props => [interval];
}

class StopPolling extends StartChargingEvent {}

class ResetNavigationFlags extends StartChargingEvent {}

class StartSessionRequested extends StartChargingEvent {
  final String phoneNumber;
  final String pin;

  StartSessionRequested(this.phoneNumber, this.pin);

  @override
  List<Object?> get props => [phoneNumber, pin];
}

class SelectSlot extends StartChargingEvent {
  final int slotNumber;
  SelectSlot(this.slotNumber);

  @override
  List<Object?> get props => [slotNumber];
}

// NEW: Final confirmation on Instructions Screen
class ConfirmAndAssignSlot extends StartChargingEvent {}

// NEW: Combined assign + lock for Dev Button
class AssignAndSimulateLock extends StartChargingEvent {}

// State
class StartChargingState extends Equatable {
  final List<SlotModel> slots;
  final int availableSlotsCount;
  final int? selectedSlotNumber;
  final bool isLoading;
  final String? error;
  final bool isCredentialsVerified;
  final bool isSlotAssigned;
  final bool isDoorLocked;
  final bool isSuccess; // Overall flow success
  final String? phoneNumber;
  final String? pin;

  const StartChargingState({
    this.slots = const [],
    this.availableSlotsCount = 0,
    this.selectedSlotNumber,
    this.isLoading = false,
    this.error,
    this.isCredentialsVerified = false,
    this.isSlotAssigned = false,
    this.isDoorLocked = false,
    this.isSuccess = false,
    this.phoneNumber,
    this.pin,
  });

  StartChargingState copyWith({
    List<SlotModel>? slots,
    int? availableSlotsCount,
    int? selectedSlotNumber,
    bool? isLoading,
    String? error,
    bool? isCredentialsVerified,
    bool? isSlotAssigned,
    bool? isDoorLocked,
    bool? isSuccess,
    String? phoneNumber,
    String? pin,
  }) {
    return StartChargingState(
      slots: slots ?? this.slots,
      availableSlotsCount: availableSlotsCount ?? this.availableSlotsCount,
      selectedSlotNumber: selectedSlotNumber ?? this.selectedSlotNumber,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isCredentialsVerified: isCredentialsVerified ?? this.isCredentialsVerified,
      isSlotAssigned: isSlotAssigned ?? this.isSlotAssigned,
      isDoorLocked: isDoorLocked ?? this.isDoorLocked,
      isSuccess: isSuccess ?? this.isSuccess,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      pin: pin ?? this.pin,
    );
  }

  @override
  List<Object?> get props => [
        slots,
        availableSlotsCount,
        selectedSlotNumber,
        isLoading,
        error,
        isCredentialsVerified,
        isSlotAssigned,
        isDoorLocked,
        isSuccess,
        phoneNumber,
        pin,
      ];
}

// BLoC
class StartChargingBloc extends Bloc<StartChargingEvent, StartChargingState> {
  final SlotRepository _slotRepository;
  Timer? _pollingTimer;

  StartChargingBloc(this._slotRepository) : super(const StartChargingState()) {
    on<FetchSlots>(_onFetchSlots);
    on<StartPeriodicPolling>(_onStartPeriodicPolling);
    on<StopPolling>(_onStopPolling);
    on<ResetNavigationFlags>(_onResetNavigationFlags);
    on<StartSessionRequested>(_onStartSessionRequested);
    on<SelectSlot>(_onSelectSlot);
    on<ConfirmAndAssignSlot>(_onConfirmAndAssignSlot);
    on<AssignAndSimulateLock>(_onAssignAndSimulateLock);
  }

  Future<void> _onFetchSlots(FetchSlots event, Emitter<StartChargingState> emit) async {
    try {
      final fetchedSlots = await _slotRepository.getSlotsState();
      
      final availableCount = fetchedSlots.where((s) => s.status == 'AVAILABLE').length;
      
      emit(state.copyWith(
        slots: fetchedSlots,
        availableSlotsCount: availableCount,
      ));
    } catch (e) {
      AppLogger.error('BLOC: Error fetching slots', e);
    }
  }

  void _onStartPeriodicPolling(StartPeriodicPolling event, Emitter<StartChargingState> emit) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(event.interval, (_) => add(FetchSlots()));
    AppLogger.debug('BLOC: Started periodic polling every ${event.interval.inSeconds}s');
  }

  void _onStopPolling(StopPolling event, Emitter<StartChargingState> emit) {
    _pollingTimer?.cancel();
    _pollingTimer = null;
    AppLogger.debug('BLOC: Stopped polling');
  }

  void _onResetNavigationFlags(ResetNavigationFlags event, Emitter<StartChargingState> emit) {
    emit(state.copyWith(
      isCredentialsVerified: false,
      isSlotAssigned: false,
      isDoorLocked: false,
      isSuccess: false,
    ));
  }

  Future<void> _onStartSessionRequested(StartSessionRequested event, Emitter<StartChargingState> emit) async {
    emit(state.copyWith(isLoading: true, error: null));
    try {
      final success = await _slotRepository.startSession(event.phoneNumber, event.pin);
      if (success) {
        emit(state.copyWith(
          isLoading: false,
          isCredentialsVerified: true,
          phoneNumber: event.phoneNumber,
          pin: event.pin,
        ));
        AppLogger.info('BLOC: Credentials verified for ${event.phoneNumber}');
        add(FetchSlots());
      } else {
        emit(state.copyWith(isLoading: false, error: 'Failed to start session. Please try again.'));
      }
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: ErrorUtil.formatError(e)));
    }
  }

  void _onSelectSlot(SelectSlot event, Emitter<StartChargingState> emit) {
    AppLogger.info('BLOC: Slot ${event.slotNumber} selected (Not assigned yet)');
    emit(state.copyWith(selectedSlotNumber: event.slotNumber));
  }

  Future<void> _onConfirmAndAssignSlot(ConfirmAndAssignSlot event, Emitter<StartChargingState> emit) async {
    if (state.selectedSlotNumber == null || state.phoneNumber == null || state.pin == null) return;

    emit(state.copyWith(isLoading: true, error: null));
    try {
      final success = await _slotRepository.assignSlot(
        state.selectedSlotNumber!,
        state.phoneNumber!,
        state.pin!,
      );
      if (success) {
        emit(state.copyWith(isLoading: false, isSuccess: true));
        AppLogger.info('BLOC: Slot ${state.selectedSlotNumber} successfully assigned and finished');
      } else {
        emit(state.copyWith(isLoading: false, error: 'Failed to assign slot. Station state may have changed.'));
      }
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: ErrorUtil.formatError(e)));
    }
  }

  Future<void> _onAssignAndSimulateLock(AssignAndSimulateLock event, Emitter<StartChargingState> emit) async {
    if (state.selectedSlotNumber == null || state.phoneNumber == null || state.pin == null) return;

    emit(state.copyWith(isLoading: true, error: null));
    try {
      AppLogger.info('BLOC: Starting sequential assign + lock simulation for slot ${state.selectedSlotNumber}');
      
      // 1. Assign Slot
      final assignSuccess = await _slotRepository.assignSlot(
        state.selectedSlotNumber!,
        state.phoneNumber!,
        state.pin!,
      );
      
      if (!assignSuccess) {
        emit(state.copyWith(isLoading: false, error: 'Step 1 Failed: Could not assign slot'));
        return;
      }

      // 2. Simulate Door Lock
      final lockSuccess = await _slotRepository.simulateDoorLock(state.selectedSlotNumber!);
      
      if (lockSuccess) {
        emit(state.copyWith(isLoading: false, isSuccess: true));
        AppLogger.info('BLOC: Sequential assign + lock simulation SUCCESS');
      } else {
        emit(state.copyWith(isLoading: false, error: 'Step 2 Failed: Could not simulate lock'));
      }
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: ErrorUtil.formatError(e)));
    }
  }

  @override
  Future<void> close() {
    _pollingTimer?.cancel();
    return super.close();
  }
}
