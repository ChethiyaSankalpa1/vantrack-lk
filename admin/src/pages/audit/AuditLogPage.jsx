import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Filter, Search, Terminal } from 'lucide-react';
import client from '../../api/client';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;

      const res = await client.get('/admin/audit-logs', { params });
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
    fetchAuditLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Security Audit Trail & Governance</h1>
          <p className="text-xs text-slate-400">
            Immutable administrative action logs recording operator overrides, trip scheduling, cancellations, and financial verifications.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        <Filter className="h-4 w-4 text-slate-500" />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Security Events</option>
          <option value="TRIP_CREATED">Trip Created</option>
          <option value="TRIP_START_OVERRIDE">Trip Start Override</option>
          <option value="TRIP_END_OVERRIDE">Trip Terminate Override</option>
          <option value="TRIP_CANCELLED">Trip Cancelled</option>
          <option value="VEHICLE_REASSIGNED">Vehicle Reassigned</option>
          <option value="PAYMENT_VERIFIED">Payment Verified</option>
          <option value="BULK_INVOICES_GENERATED">Bulk Invoices Generated</option>
          <option value="INCIDENT_RESOLVED">Incident Resolved</option>
        </select>

        {actionFilter && (
          <button onClick={() => setActionFilter('')} className="text-amber-400 hover:underline font-semibold ml-auto">
            Clear Filter
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
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-300">No security audit records logged</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Timestamp (SLST)</th>
                  <th className="px-4 py-3">Security Action</th>
                  <th className="px-4 py-3">Actor / Operator</th>
                  <th className="px-4 py-3">Target Object</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  const isOverride = log.action.includes('OVERRIDE') || log.action.includes('CANCEL');

                  return (
                    <React.Fragment key={log._id}>
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5 text-slate-300 text-[11px]">
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            timeZone: 'Asia/Colombo',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                              isOverride
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-200">
                          <span className="font-sans font-bold block">{log.userId?.name || 'Administrator'}</span>
                          <span className="text-[10px] text-slate-400 block">{log.userId?.email}</span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300 text-[11px]">
                          {log.targetType} #{log.targetId ? log.targetId.slice(-6) : 'N/A'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        <td className="px-4 py-3.5 text-right font-sans">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                            className="rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={6} className="p-4 border-b border-slate-800 font-mono text-[11px] text-emerald-400">
                            <pre className="overflow-x-auto p-3 rounded-lg bg-slate-900 border border-slate-800">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
