import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/collect_bloc.dart';
import '../../../core/di/injection.dart';
import '../../../core/repositories/slot_repository.dart';
import '../../../core/utils/logger_util.dart';
import '../../../core/utils/validation_util.dart';
import '../../../core/utils/toast_service.dart';

class CollectScreen extends StatefulWidget {
  const CollectScreen({super.key});

  @override
  State<CollectScreen> createState() => _CollectScreenState();
}

class _CollectScreenState extends State<CollectScreen> {
  final _phoneController = TextEditingController();
  final _pinController = TextEditingController();
  final _slotController = TextEditingController();
  bool _isRecoveryMode = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _pinController.dispose();
    _slotController.dispose();
    super.dispose();
  }

  void _toggleRecoveryMode() {
    setState(() {
      _isRecoveryMode = !_isRecoveryMode;
      // Clear secondary fields when toggling
      _pinController.clear();
      _slotController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => CollectBloc(sl<SlotRepository>()),
      child: BlocListener<CollectBloc, CollectState>(
        listener: (context, state) {
          if (state.isSuccess) {
            String message = _isRecoveryMode 
                ? 'Identity Verified! Locker ${state.slotNumber} is opening.'
                : 'Success! Please collect your phone from Locker ${state.slotNumber}';
            
            ToastService.showInfo(context, message);
            context.go('/');
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
          body: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 40.0),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isRecoveryMode ? 'Recover Locker' : 'Collect Mobile',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isRecoveryMode 
                        ? 'Enter Phone and Locker Number to unlock' 
                        : 'Enter your details to unlock your locker',
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 48),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      maxLength: 10,
                      decoration: const InputDecoration(
                        labelText: 'Mobile Number',
                        border: OutlineInputBorder(),
                        counterText: '',
                        prefixIcon: Icon(Icons.phone_android),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Swapping logic for PIN vs Slot Number
                    if (!_isRecoveryMode)
                      TextFormField(
                        controller: _pinController,
                        keyboardType: TextInputType.number,
                        maxLength: 4,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Key (PIN)',
                          border: OutlineInputBorder(),
                          counterText: '',
                          prefixIcon: Icon(Icons.key),
                        ),
                      )
                    else
                      TextFormField(
                        controller: _slotController,
                        keyboardType: TextInputType.number,
                        maxLength: 2,
                        decoration: const InputDecoration(
                          labelText: 'Locker Number',
                          border: OutlineInputBorder(),
                          counterText: '',
                          prefixIcon: Icon(Icons.grid_view),
                        ),
                      ),
                    const SizedBox(height: 48),
                    BlocBuilder<CollectBloc, CollectState>(
                      builder: (context, state) {
                        return Column(
                          children: [
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: ElevatedButton(
                                onPressed: state.isLoading
                                    ? null
                                    : () {
                                        final phone = _phoneController.text.trim();
                                        
                                        // Phone Validation
                                        if (!ValidationUtil.isValidPhone(phone)) {
                                          ToastService.showError(context, 'Invalid phone number. Must be 10 digits.');
                                          return;
                                        }

                                        if (_isRecoveryMode) {
                                          final slotStr = _slotController.text.trim();
                                          if (slotStr.isNotEmpty) {
                                            context.read<CollectBloc>().add(
                                                  RecoveryUnlockRequested(phone, int.parse(slotStr)),
                                                );
                                          } else {
                                            ToastService.showError(context, 'Please enter a valid Locker number.');
                                          }
                                        } else {
                                          final pin = _pinController.text.trim();
                                          if (pin.length == 4) {
                                            context.read<CollectBloc>().add(
                                                  RetrieveSessionRequested(phone, pin),
                                                );
                                          } else {
                                            ToastService.showError(context, 'Please enter a valid 4-digit key.');
                                          }
                                        }
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
                                        'Unlock',
                                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            // Forgot PIN Toggle
                            TextButton(
                              onPressed: _toggleRecoveryMode,
                              child: Text(
                                _isRecoveryMode ? 'Use PIN instead' : 'Forgot PIN?',
                                style: const TextStyle(
                                  color: Colors.blue,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: OutlinedButton(
                                onPressed: () {
                                  AppLogger.info('ACTION: Get help clicked');
                                  ToastService.showInfo(context, 'Help Desk coming soon');
                                },
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Colors.grey),
                                  shape: const StadiumBorder(),
                                ),
                                child: const Text(
                                  'Get help',
                                  style: TextStyle(color: Colors.grey, fontSize: 18, fontWeight: FontWeight.w600),
                                ),
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
          ),
        ),
      ),
    );
  }
}
