import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger_util.dart';
import '../di/injection.dart';
import '../repositories/slot_repository.dart';
import '../../features/home/view/home_screen.dart';
import '../../features/setup/view/setup_screen.dart';
import '../../features/start_charging/bloc/start_charging_bloc.dart';
import '../../features/start_charging/view/credentials_screen.dart';
import '../../features/start_charging/view/select_slot_screen.dart';
import '../../features/start_charging/view/instructions_screen.dart';
import '../../features/collect/view/collect_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  redirect: (BuildContext context, GoRouterState state) {
    final prefs = sl<SharedPreferences>();
    final String? machineId = prefs.getString('machine_id');
    final String? adminPass = prefs.getString('admin_pass');

    // If configuration is missing, force redirect to /setup
    final bool isConfigured = machineId != null && adminPass != null;
    final bool isGoingToSetup = state.matchedLocation == '/setup';

    if (!isConfigured) {
      if (!isGoingToSetup) {
        AppLogger.info('GATEKEEPING: Configuration missing. Redirecting from ${state.matchedLocation} to /setup');
      }
      return '/setup';
    }

    // If configured, and trying to go to /setup, redirect back to /
    if (isConfigured && isGoingToSetup) {
      AppLogger.info('GATEKEEPING: Kiosk already configured. Blocking access to /setup. Redirecting to /');
      return '/';
    }

    AppLogger.debug('NAVIGATION: Navigating to ${state.matchedLocation}');
    return null;
  },
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/setup',
      builder: (context, state) => const SetupScreen(),
    ),
    // Start Charging Flow Shell
    ShellRoute(
      builder: (context, state, child) {
        return BlocProvider(
          create: (context) => StartChargingBloc(sl<SlotRepository>()),
          child: child,
        );
      },
      routes: [
        GoRoute(
          path: '/start/credentials',
          builder: (context, state) => const CredentialsScreen(),
        ),
        GoRoute(
          path: '/start/slots',
          builder: (context, state) => const SelectSlotScreen(),
        ),
        GoRoute(
          path: '/start/instructions',
          builder: (context, state) => const InstructionsScreen(),
        ),
      ],
    ),
    GoRoute(
      path: '/collect',
      builder: (context, state) => const CollectScreen(),
    ),
  ],
);
