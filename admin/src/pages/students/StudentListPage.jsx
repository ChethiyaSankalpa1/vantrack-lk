import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  QrCode,
  Bus,
  Edit,
  Trash2,
  AlertCircle,
  User,
  CheckCircle,
} from 'lucide-react';
import client from '../../api/client';

export const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Enroll Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    admissionNumber: '',
    schoolName: 'Ananda College, Colombo',
    grade: 'Grade 6-B',
    parentId: '',
    assignedVehicleId: '',
    assignedRouteId: '',
    monthlyFee: 7500,
  });
  const [saving, setSaving] = useState(false);

  // QR Modal
  const [qrStudent, setQrStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const [stuRes, parRes, vehRes, rouRes] = await Promise.all([
        client.get('/admin/students', { params: { search } }),
        client.get('/admin/parents'),
        client.get('/admin/vehicles'),
        client.get('/routes'),
      ]);

      if (stuRes.data.success) setStudents(stuRes.data.data || []);
      if (parRes.data.success) setParents(parRes.data.data || []);
      if (vehRes.data.success) setVehicles(vehRes.data.data || []);
      if (rouRes.data.success) setRoutes(rouRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search]);

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        admissionNumber: student.admissionNumber || '',
        schoolName: student.schoolName,
        grade: student.grade,
        parentId: student.parentId?._id || student.parentId || '',
        assignedVehicleId: student.assignedVehicleId?._id || student.assignedVehicleId || '',
        assignedRouteId: student.assignedRouteId?._id || student.assignedRouteId || '',
        monthlyFee: student.monthlyFee || 7500,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        admissionNumber: '',
        schoolName: 'Ananda College, Colombo',
        grade: 'Grade 6-B',
        parentId: parents[0]?._id || '',
        assignedVehicleId: vehicles[0]?._id || '',
        assignedRouteId: routes[0]?._id || '',
        monthlyFee: 7500,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.schoolName || !formData.grade || !formData.parentId) {
      alert('Please fill in required fields.');
      return;
    }
    setSaving(true);
    try {
      if (editingStudent) {
        await client.put(`/admin/students/${editingStudent._id}`, formData);
        alert('Student details updated.');
      } else {
        await client.post('/admin/students', formData);
        alert('Student enrolled successfully.');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Student Directory & Passengers</h1>
          <p className="text-xs text-slate-400">
            Manage student registrations, school routes, vehicle assignments, and digital QR passes.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name, school, or admission number..."
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Students Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400">{error}</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No students registered</p>
            <p className="mt-1">Enroll your first student passenger above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">School & Grade</th>
                  <th className="px-4 py-3">Parent / Guardian</th>
                  <th className="px-4 py-3">Assigned Van</th>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Monthly Fee</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100 block">{student.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Adm: {student.admissionNumber || 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-200 block">{student.schoolName}</span>
                      <span className="text-[10px] text-amber-400 block mt-0.5">{student.grade}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-200 block">{student.parentId?.name || 'Unlinked'}</span>
                      <span className="text-[10px] text-slate-400 block">{student.parentId?.phone || ''}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <Bus className="h-3.5 w-3.5 text-slate-400" />
                        <span>{student.assignedVehicleId?.registrationNumber || 'Unassigned'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-300">{student.assignedRouteId?.name || 'None'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-100">
                        Rs. {(student.monthlyFee || 7500).toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setQrStudent(student)}
                        title="View Digital QR Pass"
                        className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-amber-500/30"
                      >
                        <QrCode className="h-3 w-3" />
                        <span>QR Pass</span>
                      </button>

                      <button
                        onClick={() => handleOpenModal(student)}
                        title="Edit Student"
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8">
            <h2 className="text-base font-bold text-slate-100 mb-1">
              {editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">Link with parent account, assign route, and set monthly fee</p>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Seth Jayawardena"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Admission No.</label>
                  <input
                    type="text"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    placeholder="e.g. AC-2024-89"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Grade / Class *</label>
                  <input
                    type="text"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g. Grade 6-B"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">School Name *</label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="e.g. Ananda College, Colombo 10"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Parent Account *</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-slate-100"
                  required
                >
                  <option value="">-- Select Parent --</option>
                  {parents.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Assigned Vehicle</label>
                  <select
                    value={formData.assignedVehicleId}
                    onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  >
                    <option value="">-- Unassigned --</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} ({v.makeModel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-300">Assigned Route</label>
                  <select
                    value={formData.assignedRouteId}
                    onChange={(e) => setFormData({ ...formData, assignedRouteId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                  >
                    <option value="">-- Unassigned --</option>
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Monthly Transport Fee (LKR)</label>
                <input
                  type="number"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
                />
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
                  {saving ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Pass Preview Modal */}
      {qrStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center">
            <h3 className="text-base font-bold text-slate-100">VanTrack LK Digital Pass</h3>
            <p className="text-xs text-slate-400 mt-0.5">Scanned by van assistant upon boarding</p>

            <div className="my-5 flex flex-col items-center justify-center p-4 rounded-xl bg-white text-slate-950 shadow-inner">
              <div className="text-xs font-mono font-bold tracking-widest text-slate-800 mb-2">
                {qrStudent.qrCodeString || 'VANTRK-STU-PASS'}
              </div>
              {/* Fallback QR representation */}
              <div className="h-40 w-40 flex items-center justify-center border-4 border-slate-900 rounded-lg p-2 bg-slate-100">
                <QrCode className="h-32 w-32 text-slate-950" />
              </div>
              <p className="mt-2 text-[11px] font-bold text-slate-800">{qrStudent.name}</p>
              <p className="text-[10px] text-slate-600">{qrStudent.schoolName} • {qrStudent.grade}</p>
            </div>

            <button
              onClick={() => setQrStudent(null)}
              className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
