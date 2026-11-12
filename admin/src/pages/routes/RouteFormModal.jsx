import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Navigation,
  Clock,
  Compass,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Bus,
} from 'lucide-react';
import client from '../../api/client';
import {
  SRI_LANKA_PROVINCES,
  getAllProvinces,
  getDistrictsForProvince,
  getDistrictInfo,
  getDistrictCenter,
} from '../../data/sriLankaLocations';
import { RouteMapComponent } from './RouteMapComponent';

export const RouteFormModal = ({ isOpen, onClose, onSaved, initialData = null }) => {
  const isEditing = Boolean(initialData?._id);

  const [province, setProvince] = useState(initialData?.province || 'Western');
  const [district, setDistrict] = useState(initialData?.district || 'Colombo');
  const [districtData, setDistrictData] = useState(getDistrictInfo('Western', 'Colombo'));

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    routeCode: initialData?.routeCode || '',
    town: initialData?.town || '',
    destinationSchool: initialData?.destinationSchool || '',
    description: initialData?.description || '',
    tripType: initialData?.tripType || 'both',
    estimatedDurationMinutes: initialData?.estimatedDurationMinutes || 45,
    distanceKm: initialData?.distanceKm || 15,
    isActive: initialData?.isActive !== false,
    startLocation: {
      name: initialData?.startLocation?.name || 'Maharagama Junction',
      latitude: initialData?.startLocation?.latitude || 6.848,
      longitude: initialData?.startLocation?.longitude || 79.926,
    },
    endLocation: {
      name: initialData?.endLocation?.name || 'Colombo 07 School Zone',
      latitude: initialData?.endLocation?.latitude || 6.904,
      longitude: initialData?.endLocation?.longitude || 79.866,
    },
    stops: initialData?.stops || [
      {
        sequence: 1,
        name: 'Maharagama Clock Tower',
        landmark: 'Opposite BOC Bank',
        latitude: 6.849,
        longitude: 79.927,
        scheduledTime: '06:45 AM',
        type: 'pickup',
      },
      {
        sequence: 2,
        name: 'Nugegoda Supermarket Stop',
        landmark: 'High Level Rd Crossing',
        latitude: 6.871,
        longitude: 79.898,
        scheduledTime: '07:05 AM',
        type: 'pickup',
      },
      {
        sequence: 3,
        name: 'Thunmulla Junction',
        landmark: 'Near Campus Gate',
        latitude: 6.896,
        longitude: 79.862,
        scheduledTime: '07:25 AM',
        type: 'pickup',
      },
    ],
  });

  const [clickMode, setClickMode] = useState('add_stop'); // 'add_stop' | 'set_start' | 'set_end'
  const [mapCenter, setMapCenter] = useState(getDistrictCenter(initialData?.district || 'Colombo'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Synchronize when initialData changes
  useEffect(() => {
    if (initialData) {
      setProvince(initialData.province || 'Western');
      setDistrict(initialData.district || 'Colombo');
      setFormData({
        name: initialData.name || '',
        routeCode: initialData.routeCode || '',
        town: initialData.town || '',
        destinationSchool: initialData.destinationSchool || '',
        description: initialData.description || '',
        tripType: initialData.tripType || 'both',
        estimatedDurationMinutes: initialData.estimatedDurationMinutes || 45,
        distanceKm: initialData.distanceKm || 15,
        isActive: initialData.isActive !== false,
        startLocation: initialData.startLocation || { name: '', latitude: 6.848, longitude: 79.926 },
        endLocation: initialData.endLocation || { name: '', latitude: 6.904, longitude: 79.866 },
        stops: initialData.stops || [],
      });
      setMapCenter(getDistrictCenter(initialData.district || 'Colombo'));
    }
  }, [initialData]);

  // Update district info when province/district changes
  useEffect(() => {
    const info = getDistrictInfo(province, district);
    setDistrictData(info);
    if (!initialData) {
      const center = getDistrictCenter(district);
      setMapCenter(center);
    }
  }, [province, district]);

  const handleProvinceChange = (newProv) => {
    setProvince(newProv);
    const districts = getDistrictsForProvince(newProv);
    const defaultDist = districts[0] || 'Colombo';
    setDistrict(defaultDist);
    setMapCenter(getDistrictCenter(defaultDist));
  };

  const handleDistrictChange = (newDist) => {
    setDistrict(newDist);
    setMapCenter(getDistrictCenter(newDist));
  };

  // Map Click Handler based on Active Mode
  const handleMapClick = (coords) => {
    if (clickMode === 'set_start') {
      setFormData((prev) => ({
        ...prev,
        startLocation: {
          ...prev.startLocation,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      }));
    } else if (clickMode === 'set_end') {
      setFormData((prev) => ({
        ...prev,
        endLocation: {
          ...prev.endLocation,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      }));
    } else {
      // Default: Add Stop
      const newStop = {
        sequence: formData.stops.length + 1,
        name: `Stop #${formData.stops.length + 1}`,
        landmark: 'Pinpointed on Map',
        latitude: coords.latitude,
        longitude: coords.longitude,
        scheduledTime: '07:15 AM',
        type: 'pickup',
      };
      setFormData((prev) => ({
        ...prev,
        stops: [...prev.stops, newStop],
      }));
    }
  };

  // Add Manual Stop
  const handleAddStop = () => {
    const center = getDistrictCenter(district);
    const newStop = {
      sequence: formData.stops.length + 1,
      name: '',
      landmark: '',
      latitude: center[0],
      longitude: center[1],
      scheduledTime: '07:15 AM',
      type: 'pickup',
    };
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, newStop],
    }));
  };

  // Update specific stop field
  const handleUpdateStop = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.stops];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stops: updated };
    });
  };

  // Remove stop
  const handleRemoveStop = (index) => {
    setFormData((prev) => {
      const filtered = prev.stops.filter((_, idx) => idx !== index);
      // Re-sequence 1..N
      const resequenced = filtered.map((s, idx) => ({ ...s, sequence: idx + 1 }));
      return { ...prev, stops: resequenced };
    });
  };

  // Move stop up/down
  const handleMoveStop = (index, direction) => {
    setFormData((prev) => {
      const stops = [...prev.stops];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= stops.length) return prev;

      const temp = stops[index];
      stops[index] = stops[targetIndex];
      stops[targetIndex] = temp;

      const resequenced = stops.map((s, idx) => ({ ...s, sequence: idx + 1 }));
      return { ...prev, stops: resequenced };
    });
  };

  // Auto-generate Route Code suggestion
  const handleGenerateCode = () => {
    const provPrefix = province.slice(0, 2).toUpperCase();
    const distPrefix = district.slice(0, 3).toUpperCase();
    const rand = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({ ...prev, routeCode: `${provPrefix}-${distPrefix}${rand}` }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Route name is required.');
      return;
    }
    if (!formData.routeCode.trim()) {
      setError('Route code is required.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      province,
      district,
    };

    try {
      let res;
      if (isEditing) {
        res = await client.put(`/routes/${initialData._id}`, payload);
      } else {
        res = await client.post('/routes', payload);
      }

      if (res.data.success) {
        onSaved(res.data.data);
        onClose();
      } else {
        setError(res.data.message || 'Failed to save route.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error saving route');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isEditing ? `Edit Route: ${initialData.routeCode}` : 'Configure Sri Lanka Transport Route'}
              </h2>
              <p className="text-xs text-slate-400">
                Define geographic jurisdiction, terminals, waypoints, and scheduled passenger stops
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Body: Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1 text-xs">
          {/* Section 1: Sri Lanka Jurisdiction & Destination */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>1. Sri Lanka Geographic Coverage</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="mb-1 block font-semibold text-slate-300">Province *</label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
                >
                  {getAllProvinces().map((p) => (
                    <option key={p} value={p}>
                      {p} Province
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">District *</label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
                >
                  {getDistrictsForProvince(province).map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Town / Hub</label>
                <input
                  type="text"
                  list="town-suggestions"
                  value={formData.town}
                  onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                  placeholder="e.g. Maharagama"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
                />
                <datalist id="town-suggestions">
                  {districtData?.towns?.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-300">Destination School</label>
                <input
                  type="text"
                  list="school-suggestions"
                  value={formData.destinationSchool}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destinationSchool: e.target.value,
                      endLocation: { ...formData.endLocation, name: e.target.value },
                    })
                  }
                  placeholder="e.g. Royal College"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
                />
                <datalist id="school-suggestions">
                  {districtData?.schools?.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Section 2: Identity & Road Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block font-semibold text-slate-300">Route Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Maharagama – Colombo 07 Express"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none font-medium"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Route Code *</label>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  Generate
                </button>
              </div>
              <input
                type="text"
                value={formData.routeCode}
                onChange={(e) => setFormData({ ...formData, routeCode: e.target.value.toUpperCase() })}
                placeholder="WP-MH07"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none uppercase font-mono"
                required
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-300">Trip Timing Service</label>
              <select
                value={formData.tripType}
                onChange={(e) => setFormData({ ...formData, tripType: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
              >
                <option value="both">Both Morning & Afternoon</option>
                <option value="morning">Morning Pickup Only</option>
                <option value="afternoon">Afternoon Drop Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-slate-300">Estimated Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={formData.distanceKm}
                onChange={(e) => setFormData({ ...formData, distanceKm: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-300">Estimated Transit Time (mins)</label>
              <input
                type="number"
                value={formData.estimatedDurationMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-slate-300">Status</label>
              <select
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 outline-none"
              >
                <option value="active">Active (Available for Trips)</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Section 3: Interactive Leaflet Route Map */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                  <span>2. Interactive Leaflet Route Mapping</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Select a mode below, then click anywhere on the Sri Lanka map to drop pins
                </p>
              </div>

              {/* Map Click Mode Toolbar */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setClickMode('add_stop')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                    clickMode === 'add_stop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  + Add Stop
                </button>
                <button
                  type="button"
                  onClick={() => setClickMode('set_start')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                    clickMode === 'set_start' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Set Start
                </button>
                <button
                  type="button"
                  onClick={() => setClickMode('set_end')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                    clickMode === 'set_end' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Set School
                </button>
              </div>
            </div>

            <RouteMapComponent
              startLocation={formData.startLocation}
              endLocation={formData.endLocation}
              stops={formData.stops}
              center={mapCenter}
              zoom={12}
              clickMode={clickMode}
              onMapClick={handleMapClick}
              interactive={true}
              height="300px"
            />

            {/* Terminals Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 space-y-1">
                <span className="font-bold text-emerald-400 text-[10px] uppercase">Starting Terminal</span>
                <input
                  type="text"
                  value={formData.startLocation.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startLocation: { ...formData.startLocation, name: e.target.value },
                    })
                  }
                  placeholder="Terminal Name"
                  className="w-full rounded border border-slate-700 bg-slate-900 p-1.5 text-slate-100"
                />
                <div className="flex gap-2 text-[10px] text-slate-400">
                  <span>Lat: {formData.startLocation.latitude}</span>
                  <span>Lng: {formData.startLocation.longitude}</span>
                </div>
              </div>

              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 space-y-1">
                <span className="font-bold text-red-400 text-[10px] uppercase">Destination School Terminal</span>
                <input
                  type="text"
                  value={formData.endLocation.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endLocation: { ...formData.endLocation, name: e.target.value },
                    })
                  }
                  placeholder="School Terminal Name"
                  className="w-full rounded border border-slate-700 bg-slate-900 p-1.5 text-slate-100"
                />
                <div className="flex gap-2 text-[10px] text-slate-400">
                  <span>Lat: {formData.endLocation.latitude}</span>
                  <span>Lng: {formData.endLocation.longitude}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Intermediate Stops Manager */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>3. Managed Stops & Timings ({formData.stops.length} Stops)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Reorder passenger pickup stops, configure landmarks, and set arrival timetable
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddStop}
                className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Stop</span>
              </button>
            </div>

            {formData.stops.length === 0 ? (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-700 rounded-lg">
                No stops added yet. Click on the map above or "+ Add Stop" to create stops.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {formData.stops.map((stop, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs"
                  >
                    {/* Sequence Badge */}
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-slate-950">
                      {stop.sequence}
                    </span>

                    {/* Stop Name */}
                    <input
                      type="text"
                      value={stop.name}
                      onChange={(e) => handleUpdateStop(index, 'name', e.target.value)}
                      placeholder="Stop Name (e.g. Junction)"
                      className="flex-1 rounded border border-slate-700 bg-slate-800 p-1.5 text-slate-100"
                    />

                    {/* Landmark */}
                    <input
                      type="text"
                      value={stop.landmark}
                      onChange={(e) => handleUpdateStop(index, 'landmark', e.target.value)}
                      placeholder="Landmark (e.g. Near BOC Bank)"
                      className="flex-1 rounded border border-slate-700 bg-slate-800 p-1.5 text-slate-100"
                    />

                    {/* Scheduled Time */}
                    <input
                      type="text"
                      value={stop.scheduledTime}
                      onChange={(e) => handleUpdateStop(index, 'scheduledTime', e.target.value)}
                      placeholder="06:50 AM"
                      className="w-24 rounded border border-slate-700 bg-slate-800 p-1.5 text-slate-100 text-center font-mono"
                    />

                    {/* Stop Type */}
                    <select
                      value={stop.type}
                      onChange={(e) => handleUpdateStop(index, 'type', e.target.value)}
                      className="rounded border border-slate-700 bg-slate-800 p-1.5 text-slate-100"
                    >
                      <option value="pickup">Pickup</option>
                      <option value="school_drop">School Drop</option>
                      <option value="school_pickup">School Pickup</option>
                      <option value="home_drop">Home Drop</option>
                    </select>

                    {/* Reorder and Delete Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveStop(index, 'up')}
                        disabled={index === 0}
                        className="rounded p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStop(index, 'down')}
                        disabled={index === formData.stops.length - 1}
                        className="rounded p-1 text-slate-400 hover:text-slate-100 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(index)}
                        className="rounded p-1 text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Stop"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4 mt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Saving Route...</span>
              </span>
            ) : (
              <span>{isEditing ? 'Save Route Changes' : 'Create & Save Route'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
