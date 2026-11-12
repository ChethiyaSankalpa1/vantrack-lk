import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../models/student_model.dart';
import '../../providers/parent_dashboard_provider.dart';
import '../../services/student_service.dart';
import '../../widgets/custom_button.dart';

class ReportAbsenceScreen extends StatefulWidget {
  final StudentModel? initialStudent;

  const ReportAbsenceScreen({super.key, this.initialStudent});

  @override
  State<ReportAbsenceScreen> createState() => _ReportAbsenceScreenState();
}

class _ReportAbsenceScreenState extends State<ReportAbsenceScreen> {
  final _studentService = StudentService();

  StudentModel? _selectedStudent;
  DateTime _absenceDate = DateTime.now().add(const Duration(days: 1));
  String _absenceType = 'full_day';
  String _reason = 'sick';
  final _noteController = TextEditingController();

  bool _isSubmitting = false;
  bool _isLoadingHistory = false;
  List<Map<String, dynamic>> _absenceHistory = [];

  final Map<String, String> _absenceTypeLabels = {
    'full_day': 'Full Day Absence (School & Van)',
    'morning_only': 'Morning Pickup Only (Not Using Morning Van)',
    'afternoon_only': 'Afternoon Return Only (Not Using Evening Van)',
    'both_transport': 'Both Transport Not Required Today',
  };

  final Map<String, String> _reasonLabels = {
    'sick': 'Sick / Feeling Unwell',
    'family_matter': 'Family Event / Vacation',
    'school_holiday': 'School Holiday / Closure',
    'personal_reason': 'Personal Reason',
    'other': 'Other Reason',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final parentProvider = context.read<ParentDashboardProvider>();
      final students = parentProvider.students;
      if (students.isNotEmpty) {
        setState(() {
          _selectedStudent = widget.initialStudent ?? students.first;
        });
        _loadAbsenceHistory();
      }
    });
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadAbsenceHistory() async {
    if (_selectedStudent == null) return;
    setState(() => _isLoadingHistory = true);
    try {
      final absences = await _fetchAbsenceList(_selectedStudent!.id);
      if (mounted) setState(() => _absenceHistory = absences);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoadingHistory = false);
    }
  }

  Future<List<Map<String, dynamic>>> _fetchAbsenceList(String studentId) async {
    try {
      final response = await _studentService.getStudentDetails(studentId);
      final list = response['absences'] as List? ?? [];
      return list.map((a) => a as Map<String, dynamic>).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _absenceDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) {
      setState(() => _absenceDate = picked);
    }
  }

  Future<void> _submitAbsence() async {
    if (_selectedStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a child.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final dateStr = _absenceDate.toIso8601String().split('T').first;
      await _studentService.reportAbsence(
        _selectedStudent!.id,
        _reason,
        absenceDate: dateStr,
        absenceType: _absenceType,
        additionalNote: _noteController.text.trim(),
      );

      if (!mounted) return;

      // Refresh parent dashboard
      await context.read<ParentDashboardProvider>().loadDashboard();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('📋 Absence report submitted! Driver, assistant & operator notified.'),
          backgroundColor: AppColors.success,
        ),
      );

      _noteController.clear();
      _loadAbsenceHistory();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to submit absence: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _cancelReport(String absenceId) async {
    try {
      await _studentService.cancelAbsenceReport(absenceId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Absence notice cancelled. Student restored to van roster.'),
          backgroundColor: AppColors.success,
        ),
      );
      _loadAbsenceHistory();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to cancel: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final parentProvider = context.watch<ParentDashboardProvider>();
    final students = parentProvider.students;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Report Student Absence'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.vanAmber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.vanAmber.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.event_busy_rounded, color: AppColors.vanAmber),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Report upcoming absences so van drivers & attendants can plan morning pickup and afternoon return rosters.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Form Section Card
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Select Child
                    const Text('1. Select Registered Child', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    if (students.isNotEmpty)
                      DropdownButtonFormField<StudentModel>(
                        initialValue: _selectedStudent ?? students.first,
                        isExpanded: true,
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        items: students.map((s) {
                          return DropdownMenuItem<StudentModel>(
                            value: s,
                            child: Text(
                              '${s.name} (${s.schoolName})',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() => _selectedStudent = val);
                            _loadAbsenceHistory();
                          }
                        },
                      ),

                    const SizedBox(height: 16),

                    // 2. Absence Date
                    const Text('2. Absence Date', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: _selectDate,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.cardBorder),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                '${_absenceDate.day}/${_absenceDate.month}/${_absenceDate.year}',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              ),
                            ),
                            const Text('Change Date', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accent)),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 3. Absence Type
                    const Text('3. Absence Scope', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _absenceType,
                      isExpanded: true,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      items: _absenceTypeLabels.entries.map((e) {
                        return DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _absenceType = val);
                      },
                    ),

                    const SizedBox(height: 16),

                    // 4. Reason
                    const Text('4. Primary Reason', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _reason,
                      isExpanded: true,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      items: _reasonLabels.entries.map((e) {
                        return DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _reason = val);
                      },
                    ),

                    const SizedBox(height: 16),

                    // 5. Additional Note
                    const Text('5. Additional Note (Optional)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _noteController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        hintText: 'e.g. Taking child to clinic in the morning...',
                        contentPadding: const EdgeInsets.all(12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),

                    const SizedBox(height: 20),

                    CustomButton(
                      text: 'Submit Absence Report 📋',
                      isLoading: _isSubmitting,
                      onPressed: _submitAbsence,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Recent Absence Notices
              const Text('Absence Notices History', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 10),

              if (_isLoadingHistory)
                const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
              else if (_absenceHistory.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: const Center(
                    child: Text('No previous absence reports recorded.', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _absenceHistory.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, i) {
                    final item = _absenceHistory[i];
                    final date = DateTime.tryParse(item['absenceDate'] ?? '') ?? DateTime.now();
                    final status = item['status'] ?? 'submitted';
                    final isSubmitted = status == 'submitted';

                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${date.day}/${date.month}/${date.year}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primary),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: status == 'ACKNOWLEDGED'
                                      ? AppColors.success.withValues(alpha: 0.12)
                                      : status == 'submitted'
                                          ? AppColors.warning.withValues(alpha: 0.12)
                                          : AppColors.error.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  status.toString().toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: status == 'ACKNOWLEDGED'
                                        ? AppColors.success
                                        : status == 'submitted'
                                            ? AppColors.warning
                                            : AppColors.error,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Scope: ${_absenceTypeLabels[item['absenceType']] ?? item['absenceType']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          Text('Reason: ${_reasonLabels[item['reason']] ?? item['reason']}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                          if (isSubmitted) ...[
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                style: TextButton.styleFrom(foregroundColor: AppColors.error),
                                onPressed: () => _cancelReport(item['_id']),
                                child: const Text('Cancel Notice'),
                              ),
                            ),
                          ],
                        ],
                      ),
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
