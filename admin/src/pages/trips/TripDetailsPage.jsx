import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  Bus,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldAlert,
  Navigation,
} from 'lucide-react';
import client from '../../api/client';

export const TripDetailsPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await client.get(`/admin/trips/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load trip dossier');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-xs text-red-400">
        <p>{error || 'Trip not found.'}</p>
        <Link to="/trips" className="mt-4 inline-block text-amber-400 underline font-semibold">
          Return to Trips
        </Link>
      </div>
    );
  }

  const { trip, attendanceRecords, incidents, latestLocation } = data;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          to="/trips"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Trip Dossier #{trip._id?.slice(-6)}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                trip.status === 'started' || trip.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : trip.status === 'completed'
                  ? 'bg-slate-800 text-slate-400'
                  : trip.status === 'cancelled'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {trip.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {trip.tripType === 'morning_pickup' ? 'Morning School Pickup' : 'Afternoon Home Drop-off'} •{' '}
            {new Date(trip.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Grid: Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Vehicle */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Transport Vehicle</span>
            <Bus className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-base font-bold text-slate-100">{trip.vehicleId?.registrationNumber || 'Unassigned'}</p>
          <p className="text-[11px] text-slate-400">{trip.vehicleId?.makeModel} (Cap: {trip.vehicleId?.capacity})</p>
          {trip.replacementVehicleId && (
            <div className="mt-2 rounded bg-amber-500/10 p-1.5 text-[10px] text-amber-300">
              Swapped to: {trip.replacementVehicleId.registrationNumber}
            </div>
          )}
        </div>

        {/* Driver */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Driver in Charge</span>
            <User className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-slate-100">{trip.driverId?.name || 'Unassigned'}</p>
          <p className="text-[11px] text-slate-400">Phone: {trip.driverId?.phone}</p>
          <p className="text-[10px] text-slate-500">Lic: {trip.driverId?.licenseNumber || 'Verified'}</p>
        </div>

        {/* Assistant */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Van Assistant</span>
            <User className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-base font-bold text-slate-100">{trip.assistantId?.name || 'None Assigned'}</p>
          <p className="text-[11px] text-slate-400">{trip.assistantId?.phone || 'N/A'}</p>
        </div>

        {/* Timing & Telemetry */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Schedule & GPS</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-base font-bold text-slate-100">{trip.scheduledStartTime || '06:30 AM'}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <span className={`h-2 w-2 rounded-full ${trip.isGpsActive ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            <span>{trip.isGpsActive ? 'GPS Beacon Active' : 'Beacon Inactive'}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Route Stops & Student Attendance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Route Stops Sequence */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-400" />
              <span>Route Sequence ({trip.routeId?.stops?.length || 0} stops)</span>
            </h2>
            <span className="text-xs text-amber-400 font-mono font-semibold">{trip.routeId?.routeCode}</span>
          </div>

          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {trip.routeId?.stops?.map((stop, idx) => (
              <div key={idx} className="relative flex items-start gap-3 text-xs pl-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 z-10">
                  {stop.sequence}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{stop.name}</p>
                  <p className="text-[11px] text-slate-400">Scheduled: {stop.scheduledTime}</p>
                  {stop.landmark && <p className="text-[10px] text-slate-500">Landmark: {stop.landmark}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Student Passengers & Live Attendance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Assigned Students & Attendance Records</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {attendanceRecords.length} recorded / {trip.assignedStudents?.length || 0} enrolled
            </span>
          </div>

          {trip.assignedStudents?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No students explicitly assigned to this trip.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">School & Grade</th>
                    <th className="py-2">Parent / Contact</th>
                    <th className="py-2">Attendance Status</th>
                    <th className="py-2">Scan Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trip.assignedStudents?.map((student) => {
                    const record = attendanceRecords.find(
                      (r) => r.studentId?._id === student._id || r.studentId === student._id
                    );

                    return (
                      <tr key={student._id}>
                        <td className="py-3 font-semibold text-slate-200">{student.name}</td>
                        <td className="py-3 text-slate-400">
                          {student.schoolName} ({student.grade})
                        </td>
                        <td className="py-3 text-slate-400">
                          {student.parentId?.name} • {student.parentId?.phone}
                        </td>
                        <td className="py-3">
                          {record ? (
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                record.status === 'boarded'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : record.status === 'dropped_off'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {record.status} ({new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Pending / Not yet scanned</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">
                          {record?.method === 'qr_scan' ? (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400">
                              <QrCode className="h-3 w-3" /> QR Pass
                            </span>
                          ) : record?.method === 'manual' ? (
                            <span className="text-[10px] text-slate-400">Manual Entry</span>
                          ) : (
                            '-'
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
      </div>

      {/* Row 3: Incidents Logged for this Trip */}
      {incidents.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-5">
          <h2 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Incidents Reported During Trip</span>
          </h2>
          <div className="space-y-2">
            {incidents.map((inc) => (
              <div key={inc._id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{inc.title}</span>
                  <span className="text-[10px] text-slate-400">Reported by {inc.reportedBy?.name}</span>
                </div>
                <p className="text-slate-300 mt-1">{inc.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
