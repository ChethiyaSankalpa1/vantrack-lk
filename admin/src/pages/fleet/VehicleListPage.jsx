import React, { useState, useEffect } from 'react';
import { Bus, Plus, User, Wrench, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import client from '../../api/client';

export const VehicleListPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [formData, setFormData] = useState({
    registrationNumber: '',
    makeModel: 'Toyota HiAce KDH 200',
    capacity: 16,
    color: 'School Yellow & White',
    driverId: '',
    assistantId: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);

  const fetchVehiclesAndCrew = async () => {
    try {
      setLoading(true);
      const [vehRes, crewRes] = await Promise.all([
        client.get('/admin/vehicles'),
        client.get('/admin/drivers'),
      ]);

      if (vehRes.data.success) setVehicles(vehRes.data.data || []);
      if (crewRes.data.success) {
        const crew = crewRes.data.data || [];
        setDrivers(crew.filter((c) => c.role === 'driver'));
        setAssistants(crew.filter((c) => c.role === 'assistant'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesAndCrew();
  }, []);

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        registrationNumber: vehicle.registrationNumber,
        makeModel: vehicle.makeModel,
        capacity: vehicle.capacity,
        color: vehicle.color || 'School Yellow & White',
        driverId: vehicle.driverId?._id || '',
        assistantId: vehicle.assistantId?._id || '',
        status: vehicle.status || 'active',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        registrationNumber: '',
        makeModel: 'Toyota HiAce KDH 200',
        capacity: 16,
        color: 'School Yellow & White',
        driverId: '',
        assistantId: '',
        status: 'active',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!formData.registrationNumber) {
      alert('Registration number is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingVehicle) {
        await client.put(`/admin/vehicles/${editingVehicle._id}`, formData);
        alert('Vehicle updated.');
      } else {
        await client.post('/admin/vehicles', formData);
        alert('Vehicle added to fleet.');
      }
      setIsModalOpen(false);
      fetchVehiclesAndCrew();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Transport Fleet Inventory</h1>
          <p className="text-xs text-slate-400">
            Registered school vans, mini-coaches, capacity limits, and crew assignments.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Van</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Registration Plate</th>
                  <th className="px-4 py-3">Make & Model</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Assigned Driver</th>
                  <th className="px-4 py-3">Van Assistant</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold text-slate-100 font-mono text-sm block">
                        {v.registrationNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{v.color}</span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      {v.makeModel}
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      <span className="font-bold text-slate-100">{v.capacity}</span> seats
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-200 block">{v.driverId?.name || 'Unassigned'}</span>
                      <span className="text-[10px] text-slate-400 block">{v.driverId?.phone || ''}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-200 block">{v.assistantId?.name || 'Unassigned'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          v.status === 'in_trip'
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                            : v.status === 'active'
                            ? 'bg-blue-500/20 text-blue-400'
                            : v.status === 'maintenance'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {v.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenModal(v)}
                        className="rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-1">
              {editingVehicle ? 'Edit Vehicle Information' : 'Add New Van to Fleet'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">Assign licensed crew, passenger seating limit, and maintenance state</p>

            <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Registration Number *</label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. WP NB-7842"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100 uppercase font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Make & Model</label>
                  <input
                    type="text"
                    value={formData.makeModel}
                    onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                    placeholder="Toyota HiAce"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Passenger Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Exterior Color / Livery</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="School Yellow & White"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Assigned Driver</label>
                <select
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="">-- None / Unassigned --</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Assigned Van Assistant</label>
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

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Operational Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="active">Active & Available</option>
                  <option value="in_trip">In Trip</option>
                  <option value="maintenance">Maintenance / Service</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingVehicle ? 'Update Van' : 'Add Van'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
