import React, { useState, useEffect } from 'react';
import {
  CalendarX,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Bus,
  Filter,
} from 'lucide-react';
import client from '../../api/client';

export const AdminAbsencePage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ submittedCount: 0, acknowledgedCount: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reject Modal State
  const [rejectingReport, setRejectingReport] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Insufficient advance notice provided');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Acknowledge Modal State
  const [acknowledgingReport, setAcknowledgingReport] = useState(null);
  const [submittingAcknowledge, setSubmittingAcknowledge] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await client.get('/admin/absences', { params });
      if (res.data.success) {
        setReports(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, dateFilter]);

  const handleAcknowledge = async () => {
    if (!acknowledgingReport) return;
    setSubmittingAcknowledge(true);
    try {
      const res = await client.patch(`/admin/absences/${acknowledgingReport._id}/acknowledge`);
      if (res.data.success) {
        alert('Absence report acknowledged! Parent notified via FCM.');
        setAcknowledgingReport(null);
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Acknowledgment failed');
    } finally {
      setSubmittingAcknowledge(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingReport) return;
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await client.patch(`/admin/absences/${rejectingReport._id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (res.data.success) {
        alert('Absence report declined. Parent notified via FCM.');
        setRejectingReport(null);
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setSubmittingReject(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.studentId?.name?.toLowerCase().includes(term) ||
      r.parentId?.name?.toLowerCase().includes(term) ||
      r.studentId?.schoolName?.toLowerCase().includes(term) ||
      r.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Student Absence Management</h1>
          <p className="text-xs text-slate-400">
            Review student absence notices, notify driver/assistant rosters, and confirm parent requests.
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Submitted Notices</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300">{stats.submittedCount}</p>
          <span className="text-[11px] text-amber-400/80">Pending operator review</span>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Acknowledged Absences</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-300">{stats.acknowledgedCount}</p>
          <span className="text-[11px] text-emerald-400/80">Rosters updated & parent notified</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reports</span>
            <CalendarX className="h-4 w-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-200">{reports.length}</p>
          <span className="text-[11px] text-slate-400">Total absence records loaded</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All Reports' },
            { key: 'submitted', label: 'Pending Review' },
            { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
            { key: 'REJECTED', label: 'Declined' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
          />

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student/parent..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Absence Reports Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarX className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-base font-bold text-slate-200">No Student Absence Reports Found</p>
            <p className="text-xs text-slate-400 mt-1">Parent student absence submissions will appear here for review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Absence Date</th>
                  <th className="px-4 py-3.5">Student & School</th>
                  <th className="px-4 py-3.5">Parent Details</th>
                  <th className="px-4 py-3.5">Scope & Reason</th>
                  <th className="px-4 py-3.5">Assigned Van</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReports.map((r) => {
                  const isSubmitted = r.status === 'submitted';
                  const isAck = r.status === 'ACKNOWLEDGED';
                  const isRej = r.status === 'REJECTED';
                  const isCanc = r.status === 'cancelled';

                  const typeMap = {
                    full_day: 'Full Day Absence',
                    morning_only: 'Morning Pickup Only',
                    afternoon_only: 'Afternoon Return Only',
                    both_transport: 'Both Transport Not Required',
                  };

                  return (
                    <tr key={r._id} className="hover:bg-slate-800/40 transition">
                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-amber-400 text-sm">
                          {new Date(r.absenceDate).toLocaleDateString('en-LK')}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Submitted: {new Date(r.submittedAt || r.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{r.studentId?.name || 'Student'}</div>
                        <div className="text-[11px] text-slate-400">{r.studentId?.schoolName} ({r.studentId?.grade})</div>
                      </td>

                      {/* Parent */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200">{r.parentId?.name || 'Parent'}</div>
                        <div className="text-[11px] text-slate-400">{r.parentId?.phone}</div>
                      </td>

                      {/* Scope & Reason */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-slate-700">
                          {typeMap[r.absenceType] || r.absenceType}
                        </span>
                        <div className="text-slate-300 font-medium capitalize mt-1">Reason: {r.reason}</div>
                        {r.additionalNote && (
                          <div className="text-[10px] text-slate-400 italic">"{r.additionalNote}"</div>
                        )}
                      </td>

                      {/* Assigned Van */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <Bus className="h-3.5 w-3.5 text-amber-400" />
                          <span>{r.studentId?.assignedVehicleId?.registrationNumber || 'Assigned Van'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {isSubmitted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                            <Clock className="h-3 w-3" /> SUBMITTED
                          </span>
                        )}
                        {isAck && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" /> ACKNOWLEDGED
                          </span>
                        )}
                        {isRej && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/30">
                            <XCircle className="h-3 w-3" /> REJECTED
                          </span>
                        )}
                        {isCanc && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {isSubmitted && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setAcknowledgingReport(r)}
                              className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-emerald-400"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => setRejectingReport(r)}
                              className="rounded-lg bg-red-500/20 px-2.5 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Acknowledge Modal */}
      {acknowledgingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <UserCheck className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-100">Acknowledge Student Absence</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Acknowledge absence report for <strong className="text-emerald-300">{acknowledgingReport.studentId?.name}</strong> on <strong className="text-amber-400">{new Date(acknowledgingReport.absenceDate).toLocaleDateString('en-LK')}</strong>? Parent, driver, and assistant will be notified.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAcknowledgingReport(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={submittingAcknowledge}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                {submittingAcknowledge ? 'Acknowledging...' : 'Acknowledge Notice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-100">Decline Student Absence Notice</h3>
            </div>
            <p className="text-xs text-slate-300">
              Enter the reason for declining this absence notice (parent will be notified):
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-slate-100 focus:border-red-500 focus:outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingReport(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={submittingReject}
                className="rounded-lg bg-red-500 px-5 py-2 text-xs font-bold text-white hover:bg-red-600"
              >
                {submittingReject ? 'Declining...' : 'Decline Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAbsencePage;
