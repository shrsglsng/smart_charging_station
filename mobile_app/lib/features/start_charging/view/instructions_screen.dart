import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/start_charging_bloc.dart';
import '../../../core/utils/toast_service.dart';
import '../../../core/widgets/door_closure_dialog.dart';
import '../../../core/widgets/thank_you_dialog.dart';

class InstructionsScreen extends StatelessWidget {
  const InstructionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<StartChargingBloc, StartChargingState>(
      listenWhen: (prev, curr) => 
          prev.isSlotAssigned != curr.isSlotAssigned || 
          prev.isSuccess != curr.isSuccess || 
          prev.error != curr.error,
      listener: (context, state) async {
        if (state.isSlotAssigned && !state.isSuccess) {
          // Slot assigned! Show the timer dialog
          final bloc = context.read<StartChargingBloc>();
          DoorClosureDialog.show(context, state.selectedSlotNumber ?? 0, bloc);
        }
        if (state.error != null) {
          ToastService.showError(context, state.error!);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => context.pop(),
          ),
          title: const Text(
            'Instructions',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Instructions',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 32),
              _buildRule(1, 'The charging is available for only 30 mins'),
              _buildRule(2, 'Use the key to open the locker (Remember your key and locker number to open the locker)'),
              _buildRule(3, 'You can choose another locker if the current locker is not working'),
              _buildRule(4, 'Report if current locker is not working'),
              const Spacer(),
              BlocBuilder<StartChargingBloc, StartChargingState>(
                builder: (context, state) {
                  return SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: state.isLoading 
                          ? null 
                          : () => context.read<StartChargingBloc>().add(ConfirmAndAssignSlot()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: const StadiumBorder(),
                        elevation: 0,
                      ),
                      child: state.isLoading 
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text(
                              'Agree and Finish',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                            ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRule(int number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$number. ',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}
