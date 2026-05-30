import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../../core/di/injection.dart';
import '../../../core/utils/logger_util.dart';
import '../../../core/utils/popup_service.dart';
import '../../../core/repositories/setup_repository.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _machineIdController = TextEditingController();
  final _locationController = TextEditingController();
  final _machinePasswordController = TextEditingController();
  final _adminPassController = TextEditingController();
  final _confirmPassController = TextEditingController();
  bool _isLoading = false;

  void _saveConfiguration() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });
      AppLogger.info('ACTION: Saving machine configuration');
      
      final prefs = sl<SharedPreferences>();
      
      try {
        final machineId = _machineIdController.text.trim().toUpperCase();
        final machinePassword = _machinePasswordController.text.trim();
        final adminPass = _adminPassController.text.trim();

        // Save locally first so the Interceptor can inject x-machine-id and x-machine-password headers on the registration request
        await prefs.setString('machine_id', machineId);
        await prefs.setString('machine_password', machinePassword);
        await prefs.setString('admin_pass', adminPass);

        // Register with backend first
        final setupRepo = sl<SetupRepository>();
        final success = await setupRepo.registerStation(machineId, ""); // Location not needed from client

        if (success) {
          AppLogger.info('ACTION: Configuration saved successfully');
          if (mounted) {
            context.go('/');
          }
        } else {
          // Revert if registration failed
          await prefs.remove('machine_id');
          await prefs.remove('machine_password');
          await prefs.remove('admin_pass');
          _showError('Failed to register station with server.');
        }
      } on DioException catch (e) {
        // Revert local save on failure
        await prefs.remove('machine_id');
        await prefs.remove('machine_password');
        await prefs.remove('admin_pass');
        
        String errorMsg = 'Connection error while registering setup.';
        if (e.response?.data != null && e.response?.data['message'] != null) {
          errorMsg = e.response?.data['message'];
        }
        AppLogger.error('Setup failed: $errorMsg');
        _showError(errorMsg);
      } catch (e) {
        await prefs.remove('machine_id');
        await prefs.remove('machine_password');
        await prefs.remove('admin_pass');
        
        AppLogger.error('Setup failed: $e');
        _showError('An unexpected error occurred.');
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    PopupService.showError(context, message);
  }

  @override
  void dispose() {
    _machineIdController.dispose();
    _locationController.dispose();
    _machinePasswordController.dispose();
    _adminPassController.dispose();
    _confirmPassController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Kiosk Setup',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: Colors.blueAccent,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Initial configuration for this station',
                              style: TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      Image.asset(
                        'assets/Aibot_Logo.png',
                        height: 40,
                      ),
                    ],
                  ),
                  const SizedBox(height: 48),
                  TextFormField(
                    controller: _machineIdController,
                    textCapitalization: TextCapitalization.characters,
                    inputFormatters: [
                      UpperCaseTextFormatter(),
                      LengthLimitingTextInputFormatter(3),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Machine ID (e.g. C01)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.settings_remote),
                      hintText: 'C01 - C99',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter Machine ID';
                      }
                      if (!RegExp(r'^C[0-9]{2}$').hasMatch(value)) {
                        return 'Invalid format. Must start with C followed by 2 numbers (e.g. C01)';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _machinePasswordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Machine Backend Password',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.key),
                      hintText: 'Password set in Admin Dashboard',
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter Machine Backend Password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _adminPassController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Admin Password',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.lock_outline),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter Admin Password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: _confirmPassController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Confirm Admin Password',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.lock_reset),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please confirm your password';
                      }
                      if (value != _adminPassController.text) {
                        return 'Passwords do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _saveConfiguration,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                        elevation: 2,
                      ),
                      child: _isLoading 
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(color: Colors.white),
                          )
                        : const Text(
                            'Save Configuration',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class UpperCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
