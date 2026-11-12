import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation,
  Bus,
  User,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import L from 'leaflet';
import client from '../../api/client';
import { useSocket } from '../../context/SocketContext';

// Custom SVG Van Marker for Leaflet
const createBusIcon = (isActive, hasDelay) => {
  const color = hasDelay ? '#f59e0b' : isActive ? '#10b981' : '#3b82f6';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"></path>
          <path d="M15 6v6"></path>
          <path d="M2 12h19.6"></path>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
          <circle cx="7" cy="18" r="2"></circle>
          <circle cx="15" cy="18" r="2"></circle>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

export const LiveTrackingPage = () => {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { connected, vehicleUpdates } = useSocket();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});

  // Fetch initial active fleet
  const fetchFleet = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/fleet/live');
      if (res.data.success) {
        setFleet(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch live fleet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Update vehicle position from real-time Socket.IO updates
  useEffect(() => {
    if (!vehicleUpdates || Object.keys(vehicleUpdates).length === 0) return;

    setFleet((prevFleet) =>
      prevFleet.map((item) => {
        const update = vehicleUpdates[item.tripId] || vehicleUpdates[item.vehicle?._id];
        if (update) {
          return {
            ...item,
            location: {
              ...item.location,
              latitude: update.latitude,
              longitude: update.longitude,
              speed: update.speed || 0,
              heading: update.heading || 0,
              timestamp: update.timestamp || new Date(),
            },
          };
        }
        return item;
      })
    );
  }, [vehicleUpdates]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Centered around Colombo / Western Province (6.9271, 79.8612)
    const map = L.map(mapRef.current, {
      center: [6.9271, 79.8612],
      zoom: 12,
      zoomControl: true,
    });

    // Dark-themed CartoDB Positron / OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Render & Update Markers on Map
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    fleet.forEach((item) => {
      const lat = item.location?.latitude || 6.9271;
      const lng = item.location?.longitude || 79.8612;
      const markerId = item.tripId;
      const hasDelay = (item.delayMinutes || 0) > 0;

      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
          <div style="font-weight: 800; font-size: 13px; color: #f8fafc; margin-bottom: 2px;">
            🚌 ${item.vehicle?.registrationNumber || 'Vehicle'}
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
            ${item.vehicle?.makeModel || 'Toyota HiAce'}
          </div>
          <div style="border-top: 1px solid #334155; padding-top: 6px; margin-bottom: 6px;">
            <div><strong>Driver:</strong> ${item.driver?.name || 'Driver'}</div>
            <div><strong>Route:</strong> ${item.route?.name || 'Route'}</div>
            <div><strong>Speed:</strong> ${Math.round(item.location?.speed || 0)} km/h</div>
            <div><strong>Boarded:</strong> ${item.attendanceCounts?.boarded || 0} students</div>
            ${hasDelay ? `<div style="color: #f59e0b; font-weight: bold;">⚠️ Delay: +${item.delayMinutes}m</div>` : ''}
          </div>
          <a href="/trips/${item.tripId}" style="color: #f59e0b; text-decoration: underline; font-weight: 600;">Open Trip Dossier</a>
        </div>
      `;

      if (markersRef.current[markerId]) {
        // Move existing marker smoothly
        markersRef.current[markerId].setLatLng([lat, lng]);
        markersRef.current[markerId].setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], {
          icon: createBusIcon(true, hasDelay),
        })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on('click', () => {
          setSelectedTrip(item);
        });

        markersRef.current[markerId] = marker;
      }
    });
  }, [fleet]);

  // Pan to vehicle when selected from list
  const handleSelectTrip = (item) => {
    setSelectedTrip(item);
    if (mapInstance.current && item.location?.latitude && item.location?.longitude) {
      mapInstance.current.setView([item.location.latitude, item.location.longitude], 14, {
        animate: true,
      });
      if (markersRef.current[item.tripId]) {
        markersRef.current[item.tripId].openPopup();
      }
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">Live Fleet Dispatch Map</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {fleet.length} Vans Active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time GPS telemetry via Socket.IO live stream • Colombo & Western Province
          </p>
        </div>

        <button
          onClick={fetchFleet}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Fleet</span>
        </button>
      </div>

      {/* Main Map + Side Fleet Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden relative shadow-xl">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Live Active Vehicles Side List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Bus className="h-4 w-4 text-amber-400" />
              <span>Active Vans ({fleet.length})</span>
            </h2>
            <span className="text-[10px] text-slate-400">
              {connected ? 'Socket Connected' : 'Reconnecting...'}
            </span>
          </div>

          {fleet.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <ShieldCheck className="h-8 w-8 text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No vans currently in transit</p>
              <p className="mt-1 text-[11px]">When a driver starts a morning or afternoon trip, live GPS will stream here.</p>
              <Link
                to="/trips"
                className="mt-3 rounded-lg bg-amber-500/20 px-3 py-1.5 font-bold text-amber-400 hover:bg-amber-500/30"
              >
                Go to Trip Scheduling
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {fleet.map((item) => {
                const isSelected = selectedTrip?.tripId === item.tripId;
                const hasDelay = (item.delayMinutes || 0) > 0;

                return (
                  <div
                    key={item.tripId}
                    onClick={() => handleSelectTrip(item)}
                    className={`rounded-xl border p-3 cursor-pointer transition text-xs ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-100 text-sm">
                        {item.vehicle?.registrationNumber || 'Vehicle'}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          hasDelay ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {hasDelay ? `+${item.delayMinutes}m DELAY` : 'ON TIME'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 truncate">
                      {item.route?.name || 'Assigned Route'}
                    </p>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800/80 pt-2 text-slate-400">
                      <div>
                        <span>Driver: </span>
                        <strong className="text-slate-200">{item.driver?.name}</strong>
                      </div>
                      <div>
                        <span>Speed: </span>
                        <strong className="text-slate-200">{Math.round(item.location?.speed || 0)} km/h</strong>
                      </div>
                      <div>
                        <span>Boarded: </span>
                        <strong className="text-emerald-400">{item.attendanceCounts?.boarded || 0}</strong>
                      </div>
                      <div>
                        <span>Dropped: </span>
                        <strong className="text-blue-400">{item.attendanceCounts?.dropped_off || 0}</strong>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {new Date(item.location?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <Link
                        to={`/trips/${item.tripId}`}
                        className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Dossier</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
