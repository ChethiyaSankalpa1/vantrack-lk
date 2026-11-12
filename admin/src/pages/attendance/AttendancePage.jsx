import React, { useState, useEffect } from 'react';
import { ClipboardCheck, QrCode, Filter, Search, User, Bus, CheckCircle2, XCircle } from 'lucide-react';
import client from '../../api/client';

export const AttendancePage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await client.get('/admin/attendance', { params });
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Student Attendance Records</h1>
          <p className="text-xs text-slate-400">
            Immutable log of student boarding, drop-off, and absence timestamps verified via QR scans and assistant records.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-semibold uppercase tracking-wider text-[11px]">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Attendance Events</option>
          <option value="boarded">Boarded Van</option>
          <option value="dropped_off">Dropped Off</option>
          <option value="absent">Reported Absent</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 outline-none"
        />

        {(statusFilter || dateFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setDateFilter('');
            }}
            className="text-amber-400 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <ClipboardCheck className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No attendance entries found</p>
            <p className="mt-1">Records appear here when QR passes are scanned during trips.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Student Passenger</th>
                  <th className="px-4 py-3">School & Grade</th>
                  <th className="px-4 py-3">Event Status</th>
                  <th className="px-4 py-3">Timestamp (SLST)</th>
                  <th className="px-4 py-3">Verification Method</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3">Trip / Route</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block">{log.studentId?.name || 'Unknown Student'}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {log.studentId?.admissionNumber || 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{log.studentId?.schoolName}</span>
                      <span className="text-[10px] text-amber-400 block mt-0.5">{log.studentId?.grade}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          log.status === 'boarded'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.status === 'dropped_off'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-200 font-mono">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        timeZone: 'Asia/Colombo',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3.5">
                      {log.method === 'qr_scan' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                          <QrCode className="h-3 w-3" />
                          <span>QR Pass Scan</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Manual Entry</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      <span className="block font-medium">{log.recordedBy?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{log.recordedBy?.role || 'Admin'}</span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">
                      <span className="block font-medium text-slate-300">{log.tripId?.routeId?.name || 'Route'}</span>
                      <span className="text-[10px] block">
                        #{log.tripId?._id?.slice(-6)} • {log.tripId?.tripType === 'morning_pickup' ? 'Morning' : 'Afternoon'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
