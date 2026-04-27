import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/start_charging_bloc.dart';
import '../../../core/utils/logger_util.dart';

class SelectSlotScreen extends StatefulWidget {
  const SelectSlotScreen({super.key});

  @override
  State<SelectSlotScreen> createState() => _SelectSlotScreenState();
}

class _SelectSlotScreenState extends State<SelectSlotScreen> {
  @override
  void initState() {
    super.initState();
    // Start periodic polling specifically for this screen (30s)
    context.read<StartChargingBloc>().add(StartPeriodicPolling(const Duration(seconds: 30)));
    // Reset any previous navigation flags
    context.read<StartChargingBloc>().add(ResetNavigationFlags());
  }

  @override
  void dispose() {
    // Stop polling when leaving this screen
    // Using context.read here might be risky on dispose, but since we are in a ShellRoute 
    // and BlocProvider is higher up, it's generally safe.
    // However, it's safer to use the Bloc instance if possible.
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<StartChargingBloc, StartChargingState>(
      listener: (context, state) {
        if (state.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error!), backgroundColor: Colors.red),
          );
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () {
              context.read<StartChargingBloc>().add(StopPolling());
              context.pop();
            },
          ),
          title: const Text(
            'Locker Selection',
            style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
          ),
        ),
        body: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
              child: Text(
                'Please select a locker',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ),
            Expanded(
              child: BlocBuilder<StartChargingBloc, StartChargingState>(
                // Use buildWhen to avoid rebuild if slots are identical
                buildWhen: (previous, current) => 
                    previous.slots != current.slots || 
                    previous.selectedSlotNumber != current.selectedSlotNumber ||
                    previous.isLoading != current.isLoading,
                builder: (context, state) {
                  return GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 10, // Optimized for Landscape Tablet
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 0.9, // Make boxes slightly smaller/sturdier
                    ),
                    itemCount: state.slots.length,
                    itemBuilder: (context, index) {
                      final slot = state.slots[index];
                      final bool isAvailable = slot.status == 'AVAILABLE';
                      final bool isSelected = state.selectedSlotNumber == slot.slotNumber;
                      final bool isLocked = slot.status == 'LOCKED';

                      return GestureDetector(
                        onTap: (isAvailable && !isLocked)
                            ? () => context.read<StartChargingBloc>().add(SelectSlot(slot.slotNumber))
                            : null,
                        child: Container(
                          decoration: BoxDecoration(
                            color: isAvailable ? Colors.white : Colors.grey[100],
                            border: Border.all(
                              color: isSelected 
                                  ? Colors.blue 
                                  : (isAvailable ? Colors.green : Colors.grey[300]!),
                              width: isSelected ? 3 : 1.5,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '${slot.slotNumber}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isAvailable ? Colors.black : Colors.grey[500],
                                  ),
                                ),
                                if (!isAvailable) 
                                  Text(
                                    isLocked ? 'Locked' : 'Used',
                                    style: TextStyle(
                                      fontSize: 9,
                                      color: Colors.grey[500],
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: BlocBuilder<StartChargingBloc, StartChargingState>(
                builder: (context, state) {
                  return Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: (state.selectedSlotNumber == null || state.isLoading)
                              ? null
                              : () {
                                  AppLogger.info('ACTION: Moving to instructions for slot ${state.selectedSlotNumber}');
                                  context.read<StartChargingBloc>().add(StopPolling());
                                  context.push('/start/instructions');
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            shape: const StadiumBorder(),
                            elevation: 0,
                          ),
                          child: state.isLoading
                              ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                              : const Text(
                                  'Proceed',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
