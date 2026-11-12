import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, Shield, CheckCircle2, XCircle, Search } from 'lucide-react';
import client from '../../api/client';

export const ParentListPage = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    address: '',
    emergencyContact: '',
    nicNumber: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/parents');
      if (res.data.success) {
        setParents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  const handleToggleStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'reactivate'} this parent account?`)) {
      return;
    }
    try {
      const res = await client.patch(`/admin/users/${userId}/status`);
      if (res.data.success) {
        fetchParents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await client.post('/admin/parents', formData);
      if (res.data.success) {
        alert('Parent account registered successfully.');
        setIsModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: 'password123',
          address: '',
          emergencyContact: '',
          nicNumber: '',
        });
        fetchParents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating parent');
    } finally {
      setSaving(false);
    }
  };

  const filtered = parents.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Parent & Guardian Accounts</h1>
          <p className="text-xs text-slate-400">
            Registered family accounts, emergency contacts, and linked children roster.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Parent</span>
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by parent name, phone number, or email..."
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No parent accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Parent Name</th>
                  <th className="px-4 py-3">Phone & Email</th>
                  <th className="px-4 py-3">Emergency Contact</th>
                  <th className="px-4 py-3">Linked Children</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((parent) => (
                  <tr key={parent._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block">{parent.name}</span>
                      <span className="text-[10px] text-slate-400 block">{parent.address || 'Sri Lanka'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{parent.phone}</span>
                      <span className="text-[10px] text-slate-400 block">{parent.email}</span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-300">
                      {parent.emergencyContact || 'None provided'}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {parent.children?.length > 0 ? (
                          parent.children.map((c) => (
                            <span
                              key={c._id}
                              className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
                            >
                              {c.name} ({c.grade})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500">No children linked</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {parent.isActive ? (
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
                        onClick={() => handleToggleStatus(parent._id, parent.isActive)}
                        className={`rounded px-2.5 py-1 text-xs font-semibold ${
                          parent.isActive
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {parent.isActive ? 'Deactivate' : 'Activate'}
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
            <h2 className="text-base font-bold text-slate-100 mb-1">Register Parent Account</h2>
            <p className="text-xs text-slate-400 mb-4">Create guardian profile for mobile app access</p>

            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kasun Jayawardena"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="parent@example.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Phone (Mobile) *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0771234567"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Home Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 18/4, High Level Road, Nugegoda"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="0719876543"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">NIC Number</label>
                  <input
                    type="text"
                    value={formData.nicNumber}
                    onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                    placeholder="1980..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
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
                  {saving ? 'Creating...' : 'Register Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
