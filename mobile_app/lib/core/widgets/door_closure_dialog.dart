import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../features/start_charging/bloc/start_charging_bloc.dart';
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

  @override
  void initState() {
    super.initState();
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return BlocListener<StartChargingBloc, StartChargingState>(
      listenWhen: (prev, curr) => prev.isSuccess != curr.isSuccess,
      listener: (context, state) {
        if (state.isSuccess) {
          _timer?.cancel();
          Navigator.of(context).pop(); // Close timer dialog
          ThankYouDialog.show(
            context, 
            message: 'The Door Is Locked And Your Phone Is Now Charging',
          );
        }
      },
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
          'Waiting for door signal...',
          style: TextStyle(
            fontStyle: FontStyle.italic,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 24),
        // Simulation Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: () {
              context.read<StartChargingBloc>().add(SimulateDoorLockOnly());
            },
            icon: const Icon(Icons.bolt, color: Colors.white),
            label: const Text('SIMULATE DOOR LOCK'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              shape: const StadiumBorder(),
            ),
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
