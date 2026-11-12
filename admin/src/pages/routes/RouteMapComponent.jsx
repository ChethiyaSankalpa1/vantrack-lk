import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Custom Map Marker Icons
const createMarkerIcon = (type, label = '') => {
  let bgColor = '#f59e0b'; // amber
  let textColor = '#0f172a';
  let size = 28;
  let content = label;

  if (type === 'start') {
    bgColor = '#10b981'; // emerald green
    textColor = '#ffffff';
    content = 'START';
    size = 32;
  } else if (type === 'end') {
    bgColor = '#ef4444'; // red
    textColor = '#ffffff';
    content = 'SCHOOL';
    size = 32;
  }

  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        background: ${bgColor};
        color: ${textColor};
        min-width: ${size}px;
        height: ${size}px;
        padding: 0 6px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 800;
        border: 2px solid #ffffff;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        white-space: nowrap;
      ">
        ${content}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export const RouteMapComponent = ({
  startLocation,
  endLocation,
  stops = [],
  center = [6.9271, 79.8612],
  zoom = 12,
  clickMode = null,
  onMapClick = null,
  interactive = true,
  height = '380px',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);
  const polylineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Center update
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    mapInstanceRef.current.setView(center, zoom, { animate: true });
  }, [center?.[0], center?.[1], zoom]);

  // Click handler
  useEffect(() => {
    if (!mapInstanceRef.current || !interactive || !onMapClick) return;
    const map = mapInstanceRef.current;

    const handleClick = (e) => {
      const { lat, lng } = e.latlng;
      onMapClick({ latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [interactive, onMapClick, clickMode]);

  // Render markers and polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    const points = [];

    // 1. Start Marker
    if (startLocation?.latitude && startLocation?.longitude) {
      const startCoord = [startLocation.latitude, startLocation.longitude];
      points.push(startCoord);

      L.marker(startCoord, { icon: createMarkerIcon('start') })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="font-size: 12px; font-weight: bold; color: #10b981;">
            ðŸŸ¢ Starting Terminal
          </div>
          <div style="font-size: 11px; color: #cbd5e1;">${startLocation.name || 'Start Point'}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">(${startLocation.latitude}, ${startLocation.longitude})</div>
        `);
    }

    // 2. Ordered Intermediate Stops
    (stops || []).forEach((stop, index) => {
      if (stop?.latitude && stop?.longitude) {
        const stopCoord = [stop.latitude, stop.longitude];
        points.push(stopCoord);

        const seq = stop.sequence || index + 1;
        L.marker(stopCoord, { icon: createMarkerIcon('stop', seq) })
          .addTo(layerGroup)
          .bindPopup(`
            <div style="font-size: 12px; font-weight: bold; color: #f59e0b;">
              Stop #${seq}: ${stop.name || 'Pickup Point'}
            </div>
            <div style="font-size: 11px; color: #cbd5e1;">Landmark: ${stop.landmark || 'N/A'}</div>
            <div style="font-size: 11px; color: #38bdf8;">Scheduled: ${stop.scheduledTime || '07:00 AM'} (${stop.type || 'pickup'})</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">(${stop.latitude}, ${stop.longitude})</div>
          `);
      }
    });

    // 3. End Destination Marker
    if (endLocation?.latitude && endLocation?.longitude) {
      const endCoord = [endLocation.latitude, endLocation.longitude];
      points.push(endCoord);

      L.marker(endCoord, { icon: createMarkerIcon('end') })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="font-size: 12px; font-weight: bold; color: #ef4444;">
            ðŸ”´ Destination School
          </div>
          <div style="font-size: 11px; color: #cbd5e1;">${endLocation.name || 'School Zone'}</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">(${endLocation.latitude}, ${endLocation.longitude})</div>
        `);
    }

    // 4. Polyline Path connecting all points
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (points.length >= 2) {
      const polyline = L.polyline(points, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(layerGroup);
      polylineRef.current = polyline;

      // Fit map view to bounds
      try {
        mapInstanceRef.current.fitBounds(polyline.getBounds(), {
          padding: [30, 30],
          maxZoom: 15,
        });
      } catch (e) {
        // Fallback if bounds collapse
      }
    }
  }, [startLocation, endLocation, stops]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 shadow-inner" style={{ height }}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {interactive && clickMode && (
        <div className="absolute top-3 left-12 z-[1000] rounded-lg bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30 shadow-lg backdrop-blur-md">
          âœ¨ Map Click Mode: <span className="uppercase font-bold underline">{clickMode.replace('_', ' ')}</span>
          <span className="text-slate-400 font-normal ml-1">(Click on map to drop location)</span>
        </div>
      )}
    </div>
  );
};
