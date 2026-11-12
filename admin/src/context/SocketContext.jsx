import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [vehicleUpdates, setVehicleUpdates] = useState({});
  const [fleetAlerts, setFleetAlerts] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Admin Socket] Connected:', socket.id);
      setConnected(true);
      socket.emit('admin:join-fleet');
    });

    socket.on('disconnect', () => {
      console.log('[Admin Socket] Disconnected');
      setConnected(false);
    });

    // Real-time live vehicle movement
    socket.on('fleet:vehicle-moved', (data) => {
      setVehicleUpdates((prev) => ({
        ...prev,
        [data.tripId || data.vehicleId]: {
          ...data,
          lastSeen: new Date(),
        },
      }));
    });

    // Real-time trip status changes
    socket.on('fleet:trip-started', (data) => {
      setFleetAlerts((prev) => [
        {
          id: Date.now(),
          type: 'info',
          title: 'Trip Started',
          message: `Trip #${data.tripId?.slice(-4)} is now active on the road.`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 19),
      ]);
    });

    socket.on('fleet:trip-ended', (data) => {
      setFleetAlerts((prev) => [
        {
          id: Date.now(),
          type: 'success',
          title: 'Trip Completed',
          message: `Trip #${data.tripId?.slice(-4)} ended successfully.`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 19),
      ]);
    });

    socket.on('fleet:trip-cancelled', (data) => {
      setFleetAlerts((prev) => [
        {
          id: Date.now(),
          type: 'error',
          title: 'Trip Cancelled',
          message: `Trip #${data.tripId?.slice(-4)} was cancelled.`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 19),
      ]);
    });

    return () => {
      if (socket) {
        socket.emit('admin:leave-fleet');
        socket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ connected, vehicleUpdates, fleetAlerts, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
