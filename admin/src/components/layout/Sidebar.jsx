import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Navigation,
  CalendarCheck,
  MapPin,
  GraduationCap,
  Users,
  Bus,
  UserCheck,
  ClipboardCheck,
  CreditCard,
  AlertTriangle,
  BarChart3,
  ShieldAlert,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard Overview', icon: LayoutDashboard },
  { path: '/tracking', label: 'Live Fleet Tracking', icon: Navigation, highlight: true },
  { path: '/trips', label: 'Trip Management', icon: CalendarCheck },
  { path: '/routes', label: 'Route Network', icon: MapPin },
  { path: '/students', label: 'Student Directory', icon: GraduationCap },
  { path: '/parents', label: 'Parent Accounts', icon: Users },
  { path: '/vehicles', label: 'Vehicle Fleet', icon: Bus },
  { path: '/drivers', label: 'Drivers & Crew', icon: UserCheck },
  { path: '/attendance', label: 'Attendance Records', icon: ClipboardCheck },
  { path: '/billing', label: 'Billing & Invoices', icon: CreditCard },
  { path: '/incidents', label: 'Incident Logbook', icon: AlertTriangle },
  { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { path: '/audit', label: 'Security Audit Trail', icon: ShieldAlert },
];

export const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Dark Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[9998] bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[9999] flex w-64 flex-col border-r border-slate-800 bg-slate-900/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-extrabold text-slate-950 shadow-lg shadow-amber-500/20">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-100 tracking-tight text-base">VanTrack</span>
                <span className="rounded bg-amber-500/20 px-1 py-0.5 text-xs font-bold text-amber-400">LK</span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fleet Operator</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            title="Close Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">Main Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  } ${item.highlight && !isActive ? 'text-amber-400' : ''}`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                    LIVE
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Footer / User Profile */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-amber-400">
                {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@vantrack.lk'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
