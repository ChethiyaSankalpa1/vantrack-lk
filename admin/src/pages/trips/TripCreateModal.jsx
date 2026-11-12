import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, Bus, User, MapPin, Users, AlertCircle } from 'lucide-react';
import client from '../../api/client';

export const TripCreateModal = ({ isOpen, onClose, onCreated }) => {
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({
    routeId: '',
    vehicleId: '',
    driverId: '',
    assistantId: '',
    tripType: 'morning_pickup',
    date: new Date().toISOString().slice(0, 10),
    scheduledStartTime: '06:30 AM',
    scheduledEndTime: '08:00 AM',
    assignedStudents: [],
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      setFetching(true);
      setError('');
      try {
        const [routesRes, vehiclesRes, driversRes, studentsRes] = await Promise.all([
          client.get('/routes'),
          client.get('/admin/vehicles'),
          client.get('/admin/drivers'),
          client.get('/admin/students?status=active'),
        ]);

        if (routesRes.data.success) setRoutes(routesRes.data.data || []);
        if (vehiclesRes.data.success) setVehicles(vehiclesRes.data.data || []);
        if (driversRes.data.success) {
          const crew = driversRes.data.data || [];
          setDrivers(crew.filter((c) => c.role === 'driver'));
          setAssistants(crew.filter((c) => c.role === 'assistant'));
        }
        if (studentsRes.data.success) setStudents(studentsRes.data.data || []);
      } catch (err) {
        setError('Failed to load routes, vehicles, or drivers.');
      } finally {
        setFetching(false);
      }
    };

    loadFormData();
  }, [isOpen]);

  // When vehicle is chosen, automatically auto-fill assigned driver and students if available
  const handleVehicleChange = (vId) => {
    setFormData((prev) => {
      const selectedV = vehicles.find((v) => v._id === vId);
      const autoDriver = selectedV?.driverId?._id || prev.driverId;
      const autoAssistant = selectedV?.assistantId?._id || prev.assistantId;

      // Select students matching this vehicle
      const matchingStudentIds = students
        .filter((s) => s.assignedVehicleId?._id === vId || s.assignedVehicleId === vId)
        .map((s) => s._id);

      return {
        ...prev,
        vehicleId: vId,
        driverId: autoDriver,
        assistantId: autoAssistant,
        assignedStudents: matchingStudentIds.length > 0 ? matchingStudentIds : prev.assignedStudents,
      };
    });
  };

  const handleStudentToggle = (sId) => {
    setFormData((prev) => {
      const exists = prev.assignedStudents.includes(sId);
      return {
        ...prev,
        assignedStudents: exists
          ? prev.assignedStudents.filter((id) => id !== sId)
          : [...prev.assignedStudents, sId],
      };
    });
  };

  const handleSelectAllStudents = () => {
    if (formData.assignedStudents.length === students.length) {
      setFormData((prev) => ({ ...prev, assignedStudents: [] }));
    } else {
      setFormData((prev) => ({ ...prev, assignedStudents: students.map((s) => s._id) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.routeId || !formData.vehicleId || !formData.driverId) {
      setError('Please select Route, Vehicle, and Driver.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await client.post('/admin/trips', formData);
      if (res.data.success) {
        onCreated(res.data.data);
        onClose();
      } else {
        setError(res.data.message || 'Failed to schedule trip');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error creating trip');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Schedule School Van Trip</h2>
              <p className="text-xs text-slate-400">Dispatch vehicle, driver, and student passenger roster</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {fetching ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading resources...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Trip Type & Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Trip Type *</label>
                <select
                  value={formData.tripType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tripType: e.target.value,
                      scheduledStartTime: e.target.value === 'morning_pickup' ? '06:30 AM' : '01:45 PM',
                      scheduledEndTime: e.target.value === 'morning_pickup' ? '08:00 AM' : '03:15 PM',
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="morning_pickup">Morning School Pickup</option>
                  <option value="afternoon_drop">Afternoon Home Drop-off</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Trip Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Scheduled Departure</label>
                <input
                  type="text"
                  value={formData.scheduledStartTime}
                  onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                  placeholder="06:30 AM"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                />
              </div>
            </div>

            {/* Route & Vehicle */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Transport Route *</label>
                <select
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.routeCode}) - {r.stops?.length || 0} stops
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Assigned Vehicle *</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.makeModel} • Cap: {v.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Driver & Assistant */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Assigned Driver *</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Driver Assistant (Optional)</label>
                <select
                  value={formData.assistantId}
                  onChange={(e) => setFormData({ ...formData, assistantId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="">-- None / Unassigned --</option>
                  {assistants.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Passenger Roster */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>Student Roster ({formData.assignedStudents.length} selected)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  {formData.assignedStudents.length === students.length ? 'Deselect All' : 'Select All Active'}
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {students.map((student) => {
                  const isChecked = formData.assignedStudents.includes(student._id);
                  return (
                    <label
                      key={student._id}
                      className={`flex items-center gap-2 rounded p-1.5 cursor-pointer transition ${
                        isChecked ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleStudentToggle(student._id)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <div className="truncate">
                        <span className="font-medium text-slate-200 block truncate">{student.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {student.schoolName} • {student.grade}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 shadow-md shadow-amber-500/20"
              >
                {loading ? 'Creating Trip...' : 'Schedule Trip'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
