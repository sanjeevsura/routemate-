'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { Users, UserCheck, Activity, ShieldAlert, Compass, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  total_users: number;
  total_guides: number;
  pending_verifications: number;
  active_sessions: number;
  total_sos_events: number;
  total_route_memories: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<DashboardStats>('/admin/overview');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'from-blue-600/20 to-blue-600/5 text-blue-400 border-blue-500/20',
      href: '/users',
    },
    {
      title: 'Active Guides',
      value: stats?.total_guides ?? 0,
      icon: UserCheck,
      color: 'from-emerald-600/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
      href: '/guides',
    },
    {
      title: 'Pending Verifications',
      value: stats?.pending_verifications ?? 0,
      icon: Clock,
      color: 'from-amber-600/20 to-amber-600/5 text-amber-400 border-amber-500/20',
      href: '/guides',
      highlight: (stats?.pending_verifications ?? 0) > 0,
    },
    {
      title: 'Active Live Sessions',
      value: stats?.active_sessions ?? 0,
      icon: Activity,
      color: 'from-cyan-600/20 to-cyan-600/5 text-cyan-400 border-cyan-500/20',
      href: '/sessions',
    },
    {
      title: 'Hazard & Route Memories',
      value: stats?.total_route_memories ?? 0,
      icon: Compass,
      color: 'from-indigo-600/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20',
      href: '/route-memory',
    },
    {
      title: 'SOS / Emergency Events',
      value: stats?.total_sos_events ?? 0,
      icon: ShieldAlert,
      color: 'from-red-600/20 to-red-600/5 text-red-400 border-red-500/20',
      href: '/safety',
      highlight: (stats?.total_sos_events ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Operations</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time platform metrics and authoritative state</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>Failed to connect to backend: {error}</span>
          <button onClick={fetchStats} className="underline text-xs ml-4">Retry</button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`p-6 rounded-2xl bg-gradient-to-b ${card.color} border transition-all hover:scale-[1.01] block relative overflow-hidden`}
            >
              {card.highlight && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">{card.title}</span>
                <Icon className="w-5 h-5 opacity-80" />
              </div>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-white tracking-tight">
                  {loading ? '—' : card.value}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Real-time Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">System Telemetry & Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 mt-4">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Backend Engine</span>
            FastAPI + PostgreSQL PostGIS
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Routing & Discovery</span>
            OSRM Engine + Photon Geocoding
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Real-time Gateway</span>
            WebSocket Event Bus + 30s Authoritative Timer
          </div>
        </div>
      </div>
    </div>
  );
}
