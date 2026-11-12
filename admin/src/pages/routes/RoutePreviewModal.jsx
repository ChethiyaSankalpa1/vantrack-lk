import React from 'react';
import { X, MapPin, Clock, Navigation, Bus, Users, ShieldCheck } from 'lucide-react';
import { RouteMapComponent } from './RouteMapComponent';

export const RoutePreviewModal = ({ isOpen, onClose, route }) => {
  if (!isOpen || !route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{route.name}</h2>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                  {route.routeCode}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    route.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {route.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {route.province} Province â€¢ {route.district} District {route.town ? `â€¢ ${route.town}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 text-xs">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Stops</span>
              <p className="text-base font-extrabold text-slate-100 mt-0.5">{route.stops?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Distance</span>
              <p className="text-base font-extrabold text-amber-400 mt-0.5">{route.distanceKm || 15} km</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Est. Duration</span>
              <p className="text-base font-extrabold text-slate-100 mt-0.5">{route.estimatedDurationMinutes || 45} mins</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Students Linked</span>
              <p className="text-base font-extrabold text-emerald-400 mt-0.5">{route.studentCount || 0}</p>
            </div>
          </div>

          {/* Interactive Leaflet Route Map */}
          <RouteMapComponent
            startLocation={route.startLocation}
            endLocation={route.endLocation}
            stops={route.stops}
            interactive={false}
            height="320px"
          />

          {/* Terminals & Stops List */}
          <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Passenger Pickup & Drop-off Timetable
            </h3>

            <div className="space-y-2">
              {/* Start */}
              <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-emerald-300">Start:</span>
                  <span className="text-slate-200">{route.startLocation?.name}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {route.startLocation?.latitude}, {route.startLocation?.longitude}
                </span>
              </div>

              {/* Intermediate Stops */}
              {(route.stops || []).map((stop, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                      {stop.sequence}
                    </span>
                    <div>
                      <p className="font-bold text-slate-200">{stop.name}</p>
                      {stop.landmark && <p className="text-[10px] text-slate-400">{stop.landmark}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400">{stop.scheduledTime}</span>
                    <span className="block text-[10px] text-slate-400 uppercase">{stop.type}</span>
                  </div>
                </div>
              ))}

              {/* End */}
              <div className="flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="font-bold text-red-300">Destination:</span>
                  <span className="text-slate-200">{route.endLocation?.name || route.destinationSchool}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  {route.endLocation?.latitude}, {route.endLocation?.longitude}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-3 mt-3 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
