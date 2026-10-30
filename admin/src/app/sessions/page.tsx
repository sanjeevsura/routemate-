'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/api';
import { Activity, Clock, CheckCircle, RefreshCw } from 'lucide-react';

interface SessionItem {
  id: string;
  traveller_id: string;
  guide_id: string;
  status: 'REQUESTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  started_at?: string;
  ended_at?: string;
  total_distance_km?: number;
  total_fare?: number;
  created_at: string;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<SessionItem[]>('/admin/sessions');
      setSessions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-cyan-400" />
            Session Operations & Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-1">Live guide-traveller engagement logs</p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading session records...</div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-200">No Sessions Recorded</h3>
          <p className="text-sm text-slate-500 mt-1">Guide sessions will appear here as users engage services.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      s.status === 'ACTIVE'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.status}
                  </span>
                  <span className="text-slate-300 font-mono text-xs">Session: {s.id}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Created: {new Date(s.created_at).toLocaleString()}
                  {s.started_at && ` • Started: ${new Date(s.started_at).toLocaleTimeString()}`}
                  {s.ended_at && ` • Ended: ${new Date(s.ended_at).toLocaleTimeString()}`}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {s.total_fare ? `₹${s.total_fare.toFixed(2)}` : 'Payment unbilled'}
                </div>
                <div className="text-xs text-slate-400">
                  {s.total_distance_km ? `${s.total_distance_km.toFixed(1)} km recorded` : 'Distance pending'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
