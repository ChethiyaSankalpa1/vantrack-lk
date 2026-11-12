import React, { useState, useEffect } from 'react';
import { Radio, Bell, RefreshCw, Clock, Menu } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const Topbar = ({ onRefresh, isRefreshing, onToggleMobileMenu }) => {
  const { connected, fleetAlerts } = useSocket();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-3 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Hamburger & Live Indicator */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onToggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-300 hover:text-slate-100 lg:hidden"
          title="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Real-time Socket Indicator */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs">
          <span
            className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0 ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="font-medium text-slate-300 truncate max-w-[130px] sm:max-w-none">
            {connected ? 'Live Fleet Stream' : 'Connecting...'}
          </span>
        </div>

        {/* Colombo Clock (hidden on very small phones) */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>
            Colombo: <strong className="text-slate-200">{timeStr}</strong>
          </span>
        </div>
      </div>

      {/* Right: Actions & Alerts */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/60 text-slate-300">
            <Bell className="h-4 w-4" />
          </div>
          {fleetAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
              {fleetAlerts.length > 9 ? '9+' : fleetAlerts.length}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
