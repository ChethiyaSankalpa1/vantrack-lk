import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Bell,
  RefreshCw,
  Clock,
  Menu,
  CheckCircle2,
  AlertTriangle,
  CalendarX,
  CreditCard,
  Bus,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import client from '../../api/client';

export const Topbar = ({ onRefresh, isRefreshing, onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { connected, fleetAlerts } = useSocket();
  const [timeStr, setTimeStr] = useState('');

  // Notifications State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef(null);

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

  // Fetch admin notifications from backend
  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await client.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await client.put('/notifications/mark-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif) => {
    setIsNotifOpen(false);
    if (!notif.isRead && notif._id) {
      client.put(`/notifications/${notif._id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
    }

    // Smart route navigation based on notification type / data
    const type = notif.type || '';
    if (type.includes('absence') || type.includes('student')) {
      navigate('/attendance/absences');
    } else if (type.includes('payment') || type.includes('deposit') || type.includes('receipt')) {
      navigate('/payments/bank-deposits');
    } else if (type.includes('incident') || type.includes('delay') || type.includes('breakdown')) {
      navigate('/incidents');
    } else if (type.includes('trip')) {
      navigate('/trips');
    } else {
      navigate('/notifications');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length + fleetAlerts.length;

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

        {/* Colombo Clock */}
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

        {/* Interactive Notifications Bell & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              fetchNotifications();
            }}
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition ${
              isNotifOpen
                ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
            }`}
            title="Notifications & Fleet Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-400" />
                  <span className="font-bold text-slate-100 text-sm">System & Fleet Alerts</span>
                  {unreadCount > 0 && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification List Container */}
              <div className="max-h-80 overflow-y-auto py-2 space-y-2 divide-y divide-slate-800/60">
                {/* Live Socket Alerts */}
                {fleetAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate('/trips');
                    }}
                    className="cursor-pointer pt-2 flex items-start gap-3 rounded-lg p-2 hover:bg-slate-800/60 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                      <Bus className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{alert.title}</span>
                        <span className="text-[10px] text-slate-500">Live</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))}

                {/* Persistent Notifications */}
                {notifications.length === 0 && fleetAlerts.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No Notifications</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Fleet alerts and system notices will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`cursor-pointer pt-2 flex items-start gap-3 rounded-lg p-2 transition ${
                        notif.isRead ? 'hover:bg-slate-800/40 opacity-75' : 'bg-slate-800/40 hover:bg-slate-800'
                      }`}
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                        notif.type?.includes('absence')
                          ? 'bg-red-500/20 text-red-400'
                          : notif.type?.includes('payment') || notif.type?.includes('deposit')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {notif.type?.includes('absence') ? (
                          <CalendarX className="h-3.5 w-3.5" />
                        ) : notif.type?.includes('payment') || notif.type?.includes('deposit') ? (
                          <CreditCard className="h-3.5 w-3.5" />
                        ) : (
                          <Bell className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${notif.isRead ? 'text-slate-300' : 'text-slate-100'}`}>
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5 line-clamp-2">{notif.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-[11px]">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/attendance/absences');
                  }}
                  className="text-slate-400 hover:text-amber-400 font-medium transition"
                >
                  Absences Queue
                </button>
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/payments/bank-deposits');
                  }}
                  className="text-slate-400 hover:text-amber-400 font-medium transition"
                >
                  Deposits Queue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
