import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../features/start_charging/bloc/start_charging_bloc.dart';
import '../utils/popup_service.dart';
import 'thank_you_dialog.dart';

class DoorClosureDialog extends StatefulWidget {
  final int slotNumber;

  const DoorClosureDialog({
    super.key,
    required this.slotNumber,
  });

  static void show(BuildContext context, int slotNumber, StartChargingBloc bloc) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => BlocProvider.value(
        value: bloc,
        child: DoorClosureDialog(slotNumber: slotNumber),
      ),
    );
  }

  @override
  State<DoorClosureDialog> createState() => _DoorClosureDialogState();
}

class _DoorClosureDialogState extends State<DoorClosureDialog> {
  int _secondsLeft = 60;
  Timer? _timer;
  bool _isFailure = false;

  late StartChargingBloc _bloc;

  @override
  void initState() {
    super.initState();
    _bloc = context.read<StartChargingBloc>();
    // Start fast polling for snappy door lock detection
    _bloc.add(StartPeriodicPolling(const Duration(seconds: 1)));
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft > 0) {
        setState(() {
          _secondsLeft--;
        });
      } else {
        _timer?.cancel();
        _handleTimeout();
      }
    });
  }

  void _handleTimeout() {
    if (mounted) {
      setState(() {
        _isFailure = true;
      });
      
      // Auto-redirect to home after 3 seconds on failure
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          context.go('/');
        }
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    // Stop fast polling when dialog closes
    _bloc.add(StopPolling());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return BlocListener<StartChargingBloc, StartChargingState>(
      listenWhen: (prev, curr) {
        if (prev.isSuccess != curr.isSuccess) return true;
        
        // Listen for actual hardware status change OR admin cancellation
        if (prev.slots.isNotEmpty && curr.slots.isNotEmpty) {
          final prevSlot = prev.slots.firstWhere((s) => s.slotNumber == widget.slotNumber, orElse: () => prev.slots.first);
          final currSlot = curr.slots.firstWhere((s) => s.slotNumber == widget.slotNumber, orElse: () => curr.slots.first);
          if (prevSlot.status != currSlot.status) {
            if (currSlot.status == 'LOCKED_CHARGING' || currSlot.status == 'AVAILABLE') {
              return true;
            }
          }
        }
        return false;
      },
      listener: (context, state) {
        bool isHardwareLocked = false;
        bool isAdminCancelled = false;
        if (state.slots.isNotEmpty) {
           final slot = state.slots.firstWhere((s) => s.slotNumber == widget.slotNumber, orElse: () => state.slots.first);
           isHardwareLocked = slot.status == 'LOCKED_CHARGING';
           isAdminCancelled = slot.status == 'AVAILABLE';
        }

        if (state.isSuccess || isHardwareLocked) {
          _timer?.cancel();
          Navigator.of(context).pop(); // Close timer dialog
          ThankYouDialog.show(
            context, 
            message: 'The Door Is Locked And Your Phone Is Now Charging',
          );
        } else if (isAdminCancelled) {
          _timer?.cancel();
          Navigator.of(context).pop(); // Close timer dialog
          PopupService.showError(context, 'Session was cancelled by Admin');
          context.go('/'); // Send back to home
        }
      },
      child: PopScope(
        canPop: false, // Prevent back gesture from closing timer dialog
        child: Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: size.width * 0.6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 50),
              child: _isFailure ? _buildFailureView() : _buildTimerView(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimerView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'CLOSE THE DOOR',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Please place your phone in Slot ${widget.slotNumber.toString().padLeft(2, '0')} and close the door.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 32),
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 130,
              height: 130,
              child: CircularProgressIndicator(
                value: _secondsLeft / 60,
                strokeWidth: 10,
                backgroundColor: Colors.blue.withOpacity(0.1),
                valueColor: AlwaysStoppedAnimation<Color>(
                  _secondsLeft < 10 ? Colors.red : Colors.blue,
                ),
              ),
            ),
            Text(
              '$_secondsLeft',
              style: TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: _secondsLeft < 10 ? Colors.red : Colors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
        const Text(
          'Waiting for the door to be locked...',
          style: TextStyle(
            fontStyle: FontStyle.italic,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildFailureView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.cancel_rounded,
            color: Colors.red,
            size: 100,
          ),
        ),
        const SizedBox(height: 32),
        const Text(
          'DETECTION FAILED',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Door close wasn\'t detected. Please try again.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 18,
            color: Colors.grey,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
