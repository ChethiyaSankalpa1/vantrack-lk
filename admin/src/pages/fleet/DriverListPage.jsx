import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Bus, ShieldCheck, Phone, Mail, Award, CheckCircle2, XCircle } from 'lucide-react';
import client from '../../api/client';

export const DriverListPage = () => {
  const [crew, setCrew] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'driver',
    licenseNumber: '',
    nicNumber: '',
    address: '',
    assignedVehicleId: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchCrewAndVehicles = async () => {
    try {
      setLoading(true);
      const [crewRes, vehRes] = await Promise.all([
        client.get('/admin/drivers'),
        client.get('/admin/vehicles'),
      ]);
      if (crewRes.data.success) setCrew(crewRes.data.data || []);
      if (vehRes.data.success) setVehicles(vehRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrewAndVehicles();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this crew member?`)) {
      return;
    }
    try {
      const res = await client.patch(`/admin/users/${userId}/status`);
      if (res.data.success) {
        fetchCrewAndVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await client.post('/admin/drivers', formData);
      if (res.data.success) {
        alert('Crew member registered successfully.');
        setIsModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'driver',
          licenseNumber: '',
          nicNumber: '',
          address: '',
          assignedVehicleId: '',
        });
        fetchCrewAndVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating crew member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Transport Crew & Drivers</h1>
          <p className="text-xs text-slate-400">
            Licensed school van drivers, onboard attendants, contact numbers, and vehicle links.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Register Crew Member</span>
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
                  <th className="px-4 py-3">Crew Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone & Email</th>
                  <th className="px-4 py-3">Driving License / NIC</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {crew.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block">{member.name}</span>
                      <span className="text-[10px] text-slate-400 block">{member.address || 'Sri Lanka'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          member.role === 'driver'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{member.phone}</span>
                      <span className="text-[10px] text-slate-400 block">{member.email}</span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-300 font-mono">
                      <span className="block">{member.licenseNumber || 'N/A'}</span>
                      <span className="text-[10px] text-slate-500 block">NIC: {member.nicNumber || 'N/A'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <Bus className="h-3.5 w-3.5 text-slate-400" />
                        <span>{member.assignedVehicleId?.registrationNumber || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {member.isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(member._id, member.isActive)}
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${
                          member.isActive
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
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
            <h2 className="text-base font-bold text-slate-100 mb-1">Register Transport Crew</h2>
            <p className="text-xs text-slate-400 mb-4">Add a driver or student assistant with Sri Lankan credentials</p>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Crew Member Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sunil Shantha"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Operational Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  >
                    <option value="driver">Van Driver</option>
                    <option value="assistant">Van Assistant / Attendant</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Mobile Phone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0783456789"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="driver@vantrack.lk"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Driving License No.</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="B-9876543"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">NIC Number</label>
                  <input
                    type="text"
                    value={formData.nicNumber}
                    onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                    placeholder="197824501234"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 24 Temple Road, Maharagama"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Default Assigned Vehicle</label>
                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                >
                  <option value="">-- None / Float Crew --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.makeModel})
                    </option>
                  ))}
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
                  {saving ? 'Registering...' : 'Register Crew Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
