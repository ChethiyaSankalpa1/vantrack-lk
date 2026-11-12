import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Navigation,
  Clock,
  Compass,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bus,
  RefreshCw,
} from 'lucide-react';
import client from '../../api/client';
import { getAllProvinces, getDistrictsForProvince } from '../../data/sriLankaLocations';
import { RouteFormModal } from './RouteFormModal';
import { RoutePreviewModal } from './RoutePreviewModal';

export const RouteListPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timingFilter, setTimingFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [previewRoute, setPreviewRoute] = useState(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (search) params.search = search;
      if (provinceFilter) params.province = provinceFilter;
      if (districtFilter) params.district = districtFilter;
      if (statusFilter) params.status = statusFilter;
      if (timingFilter) params.tripType = timingFilter;

      const res = await client.get('/routes', { params });
      if (res.data.success) {
        setRoutes(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch transport routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [search, provinceFilter, districtFilter, statusFilter, timingFilter]);

  // Province change in filter resets district
  const handleProvinceFilterChange = (prov) => {
    setProvinceFilter(prov);
    setDistrictFilter('');
  };

  // Status toggle handler
  const handleToggleStatus = async (route) => {
    try {
      const res = await client.patch(`/routes/${route._id}/status`);
      if (res.data.success) {
        setRoutes((prev) =>
          prev.map((r) => (r._id === route._id ? { ...r, isActive: !r.isActive } : r))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating route status');
    }
  };

  // Delete handler
  const handleDelete = async (route) => {
    if (!window.confirm(`Are you sure you want to permanently delete route '${route.name}' (${route.routeCode})?`)) {
      return;
    }

    try {
      const res = await client.delete(`/routes/${route._id}`);
      if (res.data.success) {
        alert(res.data.message);
        fetchRoutes();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete route.');
    }
  };

  // Open Edit Modal
  const handleEdit = (route) => {
    setEditingRoute(route);
    setIsFormModalOpen(true);
  };

  // Open Create Modal
  const handleCreate = () => {
    setEditingRoute(null);
    setIsFormModalOpen(true);
  };

  // Metrics
  const totalRoutes = routes.length;
  const activeRoutes = routes.filter((r) => r.isActive).length;
  const totalStops = routes.reduce((sum, r) => sum + (r.stopsCount || r.stops?.length || 0), 0);
  const coveredProvinces = new Set(routes.map((r) => r.province).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Transport Route Network</h1>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              Sri Lanka Nationwide
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Configure school van journeys, multi-stop pickup sequences, GPS waypoints, and school terminal links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRoutes}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Route</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Routes</span>
            <Navigation className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-100">{totalRoutes}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{activeRoutes} active and dispatchable</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Managed Stops</span>
            <MapPin className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-100">{totalStops}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Passenger boarding & drop locations</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Provinces Active</span>
            <Compass className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-100">{coveredProvinces} / 9</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cross-district school transit routes</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">System Health</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-400">Operational</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Leaflet GPS coordinate validation on</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search route name, code, school, or town..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-3 py-1.5 text-slate-200 outline-none"
          />
        </div>

        {/* Province Filter */}
        <select
          value={provinceFilter}
          onChange={(e) => handleProvinceFilterChange(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Provinces</option>
          {getAllProvinces().map((p) => (
            <option key={p} value={p}>
              {p} Province
            </option>
          ))}
        </select>

        {/* District Filter */}
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          disabled={!provinceFilter}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none disabled:opacity-40"
        >
          <option value="">All Districts</option>
          {provinceFilter &&
            getDistrictsForProvince(provinceFilter).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {/* Timing Filter */}
        <select
          value={timingFilter}
          onChange={(e) => setTimingFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 outline-none"
        >
          <option value="">All Timing Services</option>
          <option value="morning">Morning Pickup</option>
          <option value="afternoon">Afternoon Drop</option>
          <option value="both">Both Services</option>
        </select>

        {(search || provinceFilter || districtFilter || statusFilter || timingFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setProvinceFilter('');
              setDistrictFilter('');
              setStatusFilter('');
              setTimingFilter('');
            }}
            className="text-amber-400 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Routes Directory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <p className="text-xs text-slate-400">Loading Sri Lanka Route Network...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-400">
            <AlertCircle className="mx-auto h-6 w-6 mb-2" />
            <p>{error}</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs">
            <Navigation className="h-10 w-10 text-slate-600 mb-3" />
            <p className="font-semibold text-slate-300 text-sm">No transport routes found</p>
            <p className="mt-1 text-slate-500">
              {search || provinceFilter ? 'Try clearing your search filters.' : 'Get started by creating your first school route.'}
            </p>
            <button
              onClick={handleCreate}
              className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              + Create First Route
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-800/60 font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">Route & Code</th>
                  <th className="p-3.5">Jurisdiction</th>
                  <th className="p-3.5">Terminals (Start â†’ End)</th>
                  <th className="p-3.5">Stops & Timing</th>
                  <th className="p-3.5">Distance & Duration</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {routes.map((route) => (
                  <tr key={route._id} className="hover:bg-slate-800/40 transition">
                    {/* Route & Code */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{route.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {route.routeCode}
                        </span>
                        {route.destinationSchool && (
                          <span className="text-[11px] text-slate-400">
                            ðŸ« {route.destinationSchool}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Jurisdiction */}
                    <td className="p-3.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
                        {route.province} Province
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {route.district} District {route.town ? `â€¢ ${route.town}` : ''}
                      </p>
                    </td>

                    {/* Terminals */}
                    <td className="p-3.5 max-w-xs">
                      <div className="text-[11px] truncate">
                        <span className="text-emerald-400 font-bold">Start:</span>{' '}
                        {route.startLocation?.name || 'Terminal'}
                      </div>
                      <div className="text-[11px] truncate text-slate-400 mt-0.5">
                        <span className="text-red-400 font-bold">End:</span>{' '}
                        {route.endLocation?.name || route.destinationSchool || 'School'}
                      </div>
                    </td>

                    {/* Stops & Timing */}
                    <td className="p-3.5">
                      <span className="font-bold text-slate-200">
                        {route.stopsCount || route.stops?.length || 0} Stops
                      </span>
                      <span className="block text-[10px] uppercase font-semibold text-amber-400/90 mt-0.5">
                        {route.tripType === 'both' ? 'Morning & Afternoon' : route.tripType}
                      </span>
                    </td>

                    {/* Distance & Duration */}
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200">{route.distanceKm || 15} km</span>
                      <p className="text-[11px] text-slate-400">~{route.estimatedDurationMinutes || 45} mins</p>
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleStatus(route)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                          route.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${route.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span>{route.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewRoute(route)}
                          title="View Interactive Map & Stops"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(route)}
                          title="Edit Route"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(route)}
                          title="Delete Route"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Route Form Modal (Create or Edit) */}
      <RouteFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRoute(null);
        }}
        onSaved={() => {
          fetchRoutes();
        }}
        initialData={editingRoute}
      />

      {/* Route Preview Modal */}
      <RoutePreviewModal
        isOpen={Boolean(previewRoute)}
        onClose={() => setPreviewRoute(null)}
        route={previewRoute}
      />
    </div>
  );
};
