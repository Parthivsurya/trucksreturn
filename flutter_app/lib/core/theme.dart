import 'package:flutter/material.dart';

class AppTheme {
  // Color Hunt palette: 222831 / 393E46 / 00ADB5 / EEEEEE
  static const Color primary = Color(0xFF00ADB5);      // Teal accent
  static const Color primaryDark = Color(0xFF00868C);  // Deep accent
  static const Color accent = Color(0xFF00ADB5);       // Accent
  static const Color accentWeak = Color(0xFFE0F4F5);   // Light accent background
  static const Color bg = Color(0xFFEEEEEE);           // Light gray background
  static const Color surface = Colors.white;
  static const Color text = Color(0xFF222831);         // Ink primary text
  static const Color ink2 = Color(0xFF393E46);         // Ink-2 secondary text
  static const Color muted = Color(0xFF8A9199);        // Gray secondary text
  static const Color border = Color(0xFFE4E6E8);       // Border/Line
  static const Color success = Color(0xFF00868C);
  static const Color danger = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  static ThemeData light() {
    final base = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.light,
      primary: primary,
      secondary: primaryDark,
      surface: surface,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: base,
      scaffoldBackgroundColor: bg,
      fontFamily: 'Roboto',
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: text, letterSpacing: -0.5),
        displayMedium: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: text, letterSpacing: -0.3),
        headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: text),
        titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: text),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: text),
        bodyLarge: TextStyle(fontSize: 16, color: ink2, height: 1.4),
        bodyMedium: TextStyle(fontSize: 14, color: ink2, height: 1.4),
        bodySmall: TextStyle(fontSize: 12, color: muted, height: 1.3),
        labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bg,
        foregroundColor: text,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: text),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
        margin: EdgeInsets.zero,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(54),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, fontFamily: 'Roboto'),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: text,
          minimumSize: const Size.fromHeight(54),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, fontFamily: 'Roboto'),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryDark,
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, fontFamily: 'Roboto'),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: danger, width: 1.5),
        ),
        labelStyle: const TextStyle(color: muted, fontSize: 14, fontWeight: FontWeight.w500),
        hintStyle: const TextStyle(color: muted, fontSize: 14),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: accentWeak,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        labelStyle: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: primaryDark),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: text,
        unselectedItemColor: muted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        showUnselectedLabels: true,
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1, space: 1),
    );
  }
}
