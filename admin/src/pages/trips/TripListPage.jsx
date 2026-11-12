import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Play,
  Square,
  XCircle,
  Truck,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bus,
} from 'lucide-react';
import client from '../../api/client';
import { TripCreateModal } from './TripCreateModal';

export const TripListPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Reassignment Modal State
  const [reassignTrip, setReassignTrip] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedNewVehicle, setSelectedNewVehicle] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.tripType = typeFilter;
      if (dateFilter) params.date = dateFilter;

      const res = await client.get('/admin/trips', { params });
      if (res.data.success) {
        setTrips(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter, typeFilter, dateFilter]);

  // Trip Start Override
  const handleStartOverride = async (tripId) => {
    if (!window.confirm('Emergency Override: Are you sure you want to start this trip as Transport Operator? Live tracking and parent notifications will be dispatched immediately.')) {
      return;
    }
    try {
      const res = await client.post(`/admin/trips/${tripId}/start-override`);
      if (res.data.success) {
        alert('Trip started via emergency override.');
        fetchTrips();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start trip.');
    }
  };

  // Trip Terminate Override
  const handleTerminateOverride = async (tripId) => {
    if (!window.confirm('Emergency Override: Terminate and mark this trip as completed?')) {
      return;
    }
    try {
      const res = await client.post(`/admin/trips/${tripId}/terminate-override`);
      if (res.data.success) {
        alert('Trip terminated.');
        fetchTrips();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to terminate trip.');
    }
  };

  // Trip Cancellation
  const handleCancelTrip = async (tripId) => {
    const reason = window.prompt('Please enter the reason for trip cancellation (sent to all parents):', 'Technical delay / Fleet schedule adjustment');
    if (!reason) return;

    try {
      const res = await client.post(`/admin/trips/${tripId}/cancel`, { reason });
      if (res.data.success) {
        alert('Trip cancelled and notifications sent to parents.');
        fetchTrips();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel trip.');
    }
  };

  // Open Reassign Vehicle Dialog
  const openReassignDialog = async (trip) => {
    setReassignTrip(trip);
    setSelectedNewVehicle('');
    setReassignReason('Mechanical issue / Breakdown');
    try {
      const res = await client.get('/admin/vehicles');
      if (res.data.success) {
        // filter out current vehicle
        setAvailableVehicles(res.data.data.filter((v) => v._id !== trip.vehicleId?._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitReassignment = async () => {
    if (!selectedNewVehicle) {
      alert('Please select a replacement vehicle.');
      return;
    }
    setReassigning(true);
    try {
      const res = await client.post(`/admin/trips/${reassignTrip._id}/reassign-vehicle`, {
        newVehicleId: selectedNewVehicle,
        reason: reassignReason,
      });
      if (res.data.success) {
        alert('Replacement vehicle successfully assigned and parents notified.');
        setReassignTrip(null);
        fetchTrips();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reassign vehicle.');
    } finally {
      setReassigning(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'started':
      case 'active':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE
          </span>
        );
      case 'scheduled':
        return (
          <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
            SCHEDULED
          </span>
        );
      case 'assigned':
        return (
          <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-400">
            ASSIGNED
          </span>
        );
      case 'ready':
        return (
          <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-400">
            READY
          </span>
        );
      case 'completed':
        return (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-400">
            COMPLETED
          </span>
        );
      case 'cancelled':
        return (
          <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold text-red-400">
            CANCELLED
          </span>
        );
      case 'interrupted':
        return (
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
            INTERRUPTED
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Trip Control & Operations</h1>
          <p className="text-xs text-slate-400">
            Complete lifecycle management: Schedule, dispatch, monitor, and override school van runs.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule New Trip</span>
        </button>
      </div>

      {/* Filter Bar */}
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
          <option value="">All Statuses</option>
          <option value="active">Active (On Road)</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Trip Types</option>
          <option value="morning_pickup">Morning Pickup</option>
          <option value="afternoon_drop">Afternoon Drop-off</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 outline-none"
        />

        {(statusFilter || typeFilter || dateFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setTypeFilter('');
              setDateFilter('');
            }}
            className="text-amber-400 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Trip Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400">{error}</div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CalendarCheck className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No trips matching criteria</p>
            <p className="mt-1">Schedule a new trip or modify your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Trip / Type</th>
                  <th className="px-4 py-3">Route & Schedule</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Driver / Crew</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Operator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trips.map((trip) => {
                  const isActive = trip.status === 'started' || trip.status === 'active';
                  const isScheduled = trip.status === 'scheduled' || trip.status === 'assigned' || trip.status === 'ready';

                  return (
                    <tr key={trip._id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-100 block">
                          {trip.tripType === 'morning_pickup' ? 'Morning School Pickup' : 'Afternoon Home Drop'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          ID: #{trip._id?.slice(-6)} • {new Date(trip.date).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-200 block">{trip.routeId?.name || 'Unassigned'}</span>
                        <span className="text-[11px] text-amber-400/90 font-mono block mt-0.5">
                          {trip.scheduledStartTime || '06:30 AM'} - {trip.scheduledEndTime || '08:00 AM'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Bus className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-200">{trip.vehicleId?.registrationNumber || 'None'}</span>
                        </div>
                        {trip.replacementVehicleId && (
                          <span className="text-[10px] text-amber-400 block mt-0.5">
                            Replaced: {trip.replacementVehicleId.registrationNumber}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-200 block">{trip.driverId?.name || 'No driver'}</span>
                        <span className="text-[10px] text-slate-400 block">{trip.driverId?.phone || ''}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-300">
                          {trip.assignedStudents?.length || 0} enrolled
                        </span>
                      </td>

                      <td className="px-4 py-3.5">{getStatusBadge(trip.status)}</td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        {/* View Dossier */}
                        <Link
                          to={`/trips/${trip._id}`}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Dossier</span>
                        </Link>

                        {/* Emergency Start Override */}
                        {isScheduled && (
                          <button
                            onClick={() => handleStartOverride(trip._id)}
                            title="Admin Emergency Start Override"
                            className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <Play className="h-3 w-3" />
                            <span>Start</span>
                          </button>
                        )}

                        {/* Emergency Terminate Override */}
                        {isActive && (
                          <button
                            onClick={() => handleTerminateOverride(trip._id)}
                            title="Admin Emergency Terminate Override"
                            className="inline-flex items-center gap-1 rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-600"
                          >
                            <Square className="h-3 w-3" />
                            <span>End</span>
                          </button>
                        )}

                        {/* Reassign Replacement Vehicle */}
                        {(isActive || isScheduled) && (
                          <button
                            onClick={() => openReassignDialog(trip)}
                            title="Assign Replacement Vehicle (Breakdown)"
                            className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/30"
                          >
                            <Truck className="h-3 w-3" />
                            <span>Swap Van</span>
                          </button>
                        )}

                        {/* Cancel Trip */}
                        {isScheduled && (
                          <button
                            onClick={() => handleCancelTrip(trip._id)}
                            title="Cancel Scheduled Trip"
                            className="inline-flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
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

      {/* Schedule Trip Modal */}
      <TripCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          fetchTrips();
          setIsModalOpen(false);
        }}
      />

      {/* Vehicle Reassignment Modal */}
      {reassignTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-400" />
              <span>Assign Replacement Vehicle</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Trip #{reassignTrip._id?.slice(-6)} • Current: {reassignTrip.vehicleId?.registrationNumber}
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Choose Available Vehicle *</label>
                <select
                  value={selectedNewVehicle}
                  onChange={(e) => setSelectedNewVehicle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="">-- Select Replacement Van --</option>
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.makeModel} • Cap: {v.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Reassignment Reason *</label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Mechanical breakdown, flat tyre, etc."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setReassignTrip(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={submitReassignment}
                disabled={reassigning}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {reassigning ? 'Assigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
