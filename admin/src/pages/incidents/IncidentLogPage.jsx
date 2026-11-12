import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Bus, User, ShieldCheck, Filter } from 'lucide-react';
import client from '../../api/client';

export const IncidentLogPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Resolve Modal State
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('Issue resolved by fleet operations.');
  const [submitting, setSubmitting] = useState(false);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await client.get('/admin/incidents', { params });
      if (res.data.success) {
        setIncidents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, typeFilter]);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolvingIncident) return;
    setSubmitting(true);
    try {
      const res = await client.put(`/admin/incidents/${resolvingIncident._id}/resolve`, {
        resolutionNotes,
      });
      if (res.data.success) {
        alert('Incident marked as resolved.');
        setResolvingIncident(null);
        fetchIncidents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error resolving incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Fleet Incidents & Emergency Log</h1>
          <p className="text-xs text-slate-400">
            Track roadside breakdowns, traffic delays, route detours, and push immediate status resolutions.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Incident Statuses</option>
          <option value="reported">Open / Active</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Incident Categories</option>
          <option value="traffic_delay">Traffic Delay</option>
          <option value="breakdown">Mechanical Breakdown</option>
          <option value="route_change">Route Detour</option>
          <option value="weather">Inclement Weather</option>
        </select>

        {(statusFilter || typeFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setTypeFilter('');
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
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-300">No fleet incidents reported</p>
            <p className="mt-1">All school vans are running smoothly according to plan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Incident Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Vehicle & Driver</th>
                  <th className="px-4 py-3">Est. Delay</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block">{inc.title}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(inc.createdAt).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
                        {inc.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{inc.vehicleId?.registrationNumber || 'Van'}</span>
                      <span className="text-[10px] text-slate-400 block">Reported by: {inc.reportedBy?.name}</span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-amber-400">
                      +{inc.estimatedDelayMinutes || 15} mins
                    </td>

                    <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate">
                      {inc.description}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          inc.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {inc.status !== 'resolved' ? (
                        <button
                          onClick={() => {
                            setResolvingIncident(inc);
                            setResolutionNotes('Issue resolved and route resumed.');
                          }}
                          className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-1">Resolve Incident</h2>
            <p className="text-xs text-slate-400 mb-4">
              {resolvingIncident.title} • {resolvingIncident.vehicleId?.registrationNumber}
            </p>

            <form onSubmit={handleResolve} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Resolution Details *</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the corrective actions taken (e.g. tyre changed, traffic passed, replacement van dispatched)..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100 outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingIncident(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-emerald-500 px-5 py-2 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
