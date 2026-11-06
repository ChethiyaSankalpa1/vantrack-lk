import 'package:flutter/material.dart';
import '../../../config/app_colors.dart';

typedef IncidentReportCallback = Future<void> Function(
  String type,
  String title,
  String description,
  int delayMinutes,
);

class DriverIncidentButton extends StatelessWidget {
  final IncidentReportCallback onReport;

  const DriverIncidentButton({super.key, required this.onReport});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.warning,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        icon: const Icon(Icons.warning_amber_rounded, size: 20),
        label: const Text(
          'Report Delay / Breakdown',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
        onPressed: () => _showIncidentSheet(context),
      ),
    );
  }

  void _showIncidentSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _IncidentReportSheet(onReport: onReport),
    );
  }
}

class _IncidentReportSheet extends StatefulWidget {
  final IncidentReportCallback onReport;

  const _IncidentReportSheet({required this.onReport});

  @override
  State<_IncidentReportSheet> createState() => _IncidentReportSheetState();
}

class _IncidentReportSheetState extends State<_IncidentReportSheet> {
  String _selectedType = 'traffic_delay';
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  double _delayMinutes = 10;
  bool _submitting = false;
  final _formKey = GlobalKey<FormState>();

  static const _types = [
    _IncidentType('traffic_delay', '🚦 Traffic Delay', AppColors.warning),
    _IncidentType('breakdown', '🔧 Vehicle Breakdown', AppColors.error),
    _IncidentType('route_change', '🗺️ Route Change', AppColors.info),
    _IncidentType('other', '📋 Other', AppColors.textSecondary),
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomPad = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + bottomPad),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 16),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.cardBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Title
              const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 22),
                  SizedBox(width: 10),
                  Text(
                    'Report an Incident',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Parents will be notified immediately.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // Incident type picker
              const Text(
                'Incident Type',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _types.map((t) {
                  final isSelected = _selectedType == t.value;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedType = t.value),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? t.color.withValues(alpha: 0.15)
                            : AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? t.color : AppColors.cardBorder,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Text(
                        t.label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? t.color : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),

              // Title field
              const Text(
                'Short Title *',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  hintText: 'e.g. Heavy traffic on Kandy Road',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.cardBorder),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Please enter a title' : null,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 14),

              // Description field
              const Text(
                'Description',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Provide additional details for parents and administration...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.cardBorder),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 18),

              // Delay slider (only for traffic_delay)
              if (_selectedType == 'traffic_delay' || _selectedType == 'breakdown') ...[
                Row(
                  children: [
                    const Text(
                      'Estimated Delay:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_delayMinutes.round()} min',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.warning,
                        ),
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: _delayMinutes,
                  min: 5,
                  max: 60,
                  divisions: 11,
                  activeColor: AppColors.warning,
                  onChanged: (v) => setState(() => _delayMinutes = v),
                ),
                const SizedBox(height: 8),
              ],

              // Submit button
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          '📢 Submit & Notify Parents',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      await widget.onReport(
        _selectedType,
        _titleController.text.trim(),
        _descController.text.trim(),
        _delayMinutes.round(),
      );
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _IncidentType {
  final String value;
  final String label;
  final Color color;

  const _IncidentType(this.value, this.label, this.color);
}
