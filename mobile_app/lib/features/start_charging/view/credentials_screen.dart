import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/di/injection.dart';
import '../../../core/repositories/slot_repository.dart';
import '../../../core/utils/logger_util.dart';
import '../../../core/utils/validation_util.dart';
import '../../../core/utils/toast_service.dart';
import '../bloc/start_charging_bloc.dart';

class CredentialsScreen extends StatefulWidget {
  const CredentialsScreen({super.key});

  @override
  State<CredentialsScreen> createState() => _CredentialsScreenState();
}

class _CredentialsScreenState extends State<CredentialsScreen> {
  final _phoneController = TextEditingController();
  final _pinController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Initial fetch when landing on this screen
    context.read<StartChargingBloc>().add(FetchSlots());
    // Ensure flags from previous failed/canceled attempts are cleared
    context.read<StartChargingBloc>().add(ResetNavigationFlags());
  }

  void _autoGeneratePin() {
    AppLogger.debug('ACTION: Auto-generating PIN');
    final random = Random();
    final pin = (random.nextInt(9000) + 1000).toString();
    _pinController.text = pin;
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<StartChargingBloc, StartChargingState>(
      listener: (context, state) {
        if (state.isCredentialsVerified) {
          context.push('/start/slots');
          // Reset flag immediately to prevent loop when state updates (e.g. from polls)
          context.read<StartChargingBloc>().add(ResetNavigationFlags());
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
        ),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              const Text(
                'Enter Mobile Number',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 48),
              Row(
                children: [
                  SizedBox(
                    width: 80,
                    child: TextFormField(
                      initialValue: '+91',
                      readOnly: true,
                      decoration: const InputDecoration(
                        labelText: 'ISD',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      decoration: const InputDecoration(
                        labelText: 'Mobile Number',
                        border: OutlineInputBorder(),
                        counterText: '',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: _pinController,
                      keyboardType: TextInputType.number,
                      maxLength: 4,
                      decoration: const InputDecoration(
                        labelText: 'Key',
                        border: OutlineInputBorder(),
                        counterText: '',
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 1,
                    child: OutlinedButton(
                      onPressed: _autoGeneratePin,
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.blue),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Auto Generate'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // PIN Guidelines
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PIN Guidelines:',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  SizedBox(height: 8),
                  _GuidelineItem(text: 'Must be exactly 4 digits.'),
                  _GuidelineItem(text: 'Avoid repetitive numbers (e.g., 1111).'),
                  _GuidelineItem(text: 'Avoid sequential numbers (e.g., 1234, 4321).'),
                ],
              ),
              const SizedBox(height: 32),
              BlocBuilder<StartChargingBloc, StartChargingState>(
                builder: (context, state) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: state.isLoading
                              ? null
                              : () {
                                  final phone = _phoneController.text.trim();
                                  final pin = _pinController.text.trim();
                                  
                                  // Validation
                                  if (!ValidationUtil.isValidPhone(phone)) {
                                    ToastService.showError(context, 'Invalid phone number. Must be 10 digits.');
                                    return;
                                  }
                                  
                                  final pinValidation = ValidationUtil.isPinSecure(pin);
                                  if (!pinValidation.isValid) {
                                    ToastService.showError(context, pinValidation.message);
                                    return;
                                  }

                                  AppLogger.info('ACTION: Continue button pressed -> Attempting session start for $phone');
                                  context.read<StartChargingBloc>().add(
                                        StartSessionRequested(phone, pin),
                                      );
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                            shape: const StadiumBorder(),
                            elevation: 0,
                          ),
                          child: state.isLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text(
                                  'Continue',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        '${state.availableSlotsCount} slots available',
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GuidelineItem extends StatelessWidget {
  final String text;
  const _GuidelineItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        children: [
          const Icon(Icons.circle, size: 6, color: Colors.grey),
          const SizedBox(width: 8),
          Text(
            text,
            style: const TextStyle(fontSize: 13, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
