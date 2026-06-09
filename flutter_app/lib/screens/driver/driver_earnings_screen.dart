import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/driver_api.dart';
import '../../core/theme.dart';

class DriverEarningsScreen extends StatefulWidget {
  const DriverEarningsScreen({super.key});

  @override
  State<DriverEarningsScreen> createState() => _DriverEarningsScreenState();
}

class _DriverEarningsScreenState extends State<DriverEarningsScreen> {
  List<Map<String, dynamic>> _bookings = [];
  bool _loading = true;
  bool _isCalendarVisible = true;

  // Track the current visible year & month on the calendar
  late int _currentYear;
  late int _currentMonth;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _currentYear = now.year;
    _currentMonth = now.month;
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    setState(() => _loading = true);
    try {
      final list = await DriverApi.getBookings();
      setState(() {
        _bookings = list;
        _loading = false;
      });
    } catch (e) {
      debugPrint('Error loading bookings for earnings: $e');
      setState(() => _loading = false);
    }
  }

  // Group earnings for the selected year & month
  Map<int, double> _getDailyEarnings(int year, int month) {
    final Map<int, double> daily = {};

    // Load earnings purely from database bookings
    for (var b in _bookings) {
      if (b['status']?.toString() == 'delivered') {
        final price = (b['agreed_price'] as num?)?.toDouble() ?? 0.0;
        final dateStr = b['delivered_at']?.toString() ?? b['booked_at']?.toString();
        if (dateStr != null) {
          try {
            final date = DateTime.parse(dateStr).toLocal();
            if (date.year == year && date.month == month) {
              daily[date.day] = (daily[date.day] ?? 0.0) + price;
            }
          } catch (_) {}
        }
      }
    }

    return daily;
  }

  void _prevMonth() {
    setState(() {
      if (_currentMonth == 1) {
        _currentMonth = 12;
        _currentYear--;
      } else {
        _currentMonth--;
      }
    });
  }

  void _nextMonth() {
    setState(() {
      if (_currentMonth == 12) {
        _currentMonth = 1;
        _currentYear++;
      } else {
        _currentMonth++;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Generate dates for current month grid
    final date = DateTime(_currentYear, _currentMonth, 1);
    final String monthName = DateFormat('MMMM yyyy').format(date);

    // June 1, 2026 is Monday. Monday is weekday 1. 
    // Sunday should be index 0. So offset is date.weekday % 7.
    // Monday % 7 = 1. Sunday % 7 = 0. Saturday % 7 = 6.
    final int firstDayOffset = date.weekday % 7;
    final int daysInMonth = DateTime(_currentYear, _currentMonth + 1, 0).day;

    final dailyEarnings = _getDailyEarnings(_currentYear, _currentMonth);
    final double totalProfits = dailyEarnings.values.fold(0.0, (sum, val) => sum + val);

    final moneyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Earnings',
          style: TextStyle(color: AppTheme.text, fontWeight: FontWeight.w700, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(
                      color: Color.fromRGBO(34, 40, 49, 0.06),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    )
                  ],
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // TOTAL PROFITS Header Section
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFE0F7F4), // Light green-teal
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text(
                                    '₹',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF00ADB5), // Accent teal
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'TOTAL PROFITS',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF8A9199),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    moneyFormat.format(totalProfits),
                                    style: const TextStyle(
                                      fontSize: 26,
                                      fontWeight: FontWeight.w900,
                                      color: AppTheme.text,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          // Collapsible button
                          GestureDetector(
                            onTap: () => setState(() => _isCalendarVisible = !_isCalendarVisible),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF), // Light indigo-blue
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _isCalendarVisible ? 'Hide' : 'Show',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF2563EB), // Indigo-blue
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(
                                    _isCalendarVisible
                                        ? Icons.keyboard_arrow_up_rounded
                                        : Icons.keyboard_arrow_down_rounded,
                                    size: 16,
                                    color: const Color(0xFF2563EB),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    if (_isCalendarVisible) ...[
                      // Divider separating profits from calendar
                      Container(
                        height: 1,
                        color: AppTheme.border,
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                      ),

                      Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            // Calendar Navigation Header
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Earnings · $monthName',
                                  style: const TextStyle(
                                    fontSize: 15.5,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.text,
                                  ),
                                ),
                                Row(
                                  children: [
                                    GestureDetector(
                                      onTap: _prevMonth,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF3F4F6),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.chevron_left_rounded, size: 18, color: AppTheme.text),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    GestureDetector(
                                      onTap: _nextMonth,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF3F4F6),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.chevron_right_rounded, size: 18, color: AppTheme.text),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Calendar Days-of-week Label Header
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: const [
                                _DayOfWeekLabel(label: 'Sun'),
                                _DayOfWeekLabel(label: 'Mon'),
                                _DayOfWeekLabel(label: 'Tue'),
                                _DayOfWeekLabel(label: 'Wed'),
                                _DayOfWeekLabel(label: 'Thu'),
                                _DayOfWeekLabel(label: 'Fri'),
                                _DayOfWeekLabel(label: 'Sat'),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Calendar Day Grid
                            GridView.builder(
                              physics: const NeverScrollableScrollPhysics(),
                              shrinkWrap: true,
                              itemCount: firstDayOffset + daysInMonth,
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 7,
                                childAspectRatio: 0.82,
                                crossAxisSpacing: 6,
                                mainAxisSpacing: 6,
                              ),
                              itemBuilder: (context, index) {
                                if (index < firstDayOffset) {
                                  return const SizedBox.shrink();
                                }
                                final day = index - firstDayOffset + 1;
                                final hasEarnings = dailyEarnings.containsKey(day);
                                final amount = dailyEarnings[day] ?? 0.0;

                                return Container(
                                  decoration: BoxDecoration(
                                    color: hasEarnings ? const Color(0xFFE0F7F4) : AppTheme.surface,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: hasEarnings ? const Color(0xFF00ADB5) : const Color(0xFFE5E7EB),
                                      width: hasEarnings ? 1.5 : 1.0,
                                    ),
                                  ),
                                  padding: const EdgeInsets.all(6.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '$day',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: hasEarnings ? FontWeight.w900 : FontWeight.w500,
                                          color: hasEarnings ? const Color(0xFF00868C) : const Color(0xFF4B5563),
                                        ),
                                      ),
                                      if (hasEarnings)
                                        FittedBox(
                                          fit: BoxFit.scaleDown,
                                          child: Text(
                                            '₹${amount.toStringAsFixed(0)}',
                                            style: const TextStyle(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF00868C), // Accent Deep
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }
}

class _DayOfWeekLabel extends StatelessWidget {
  final String label;
  const _DayOfWeekLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Center(
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: Color(0xFF8A9199),
          ),
        ),
      ),
    );
  }
}
