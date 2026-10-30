'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/api';
import { ShieldAlert, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SOSEvent {
  id: string;
  user_id: string;
  session_id?: string;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_ALARM';
  battery_level?: number;
  created_at: string;
  resolved_at?: string;
}

export default function SOSSafetyPage() {
  const [events, setEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<SOSEvent[]>('/admin/sos');
      setEvents(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch emergency events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await adminFetch(`/sos/${id}/resolve`, {
        method: 'POST',
      });
      fetchEvents();
    } catch (err: any) {
      alert(`Failed to resolve SOS: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            SOS & Safety Incident Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">Authoritative log of emergency distress beacons</p>
        </div>
        <button
          onClick={fetchEvents}
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
        <div className="p-12 text-center text-slate-400">Loading incident data...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-200">No Emergency Incidents Reported</h3>
          <p className="text-sm text-slate-500 mt-1">All travellers and guides are currently safe.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-6 rounded-2xl border ${
                evt.status === 'ACTIVE'
                  ? 'bg-red-950/30 border-red-500/40 shadow-lg shadow-red-950/50'
                  : 'bg-slate-900 border-slate-800'
              } flex flex-col md:flex-row md:items-center justify-between gap-6`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      evt.status === 'ACTIVE'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {evt.status}
                  </span>
                  <span className="text-slate-300 font-mono text-xs">ID: {evt.id}</span>
                </div>
                <div className="text-sm text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  GPS: {evt.latitude.toFixed(6)}, {evt.longitude.toFixed(6)}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${evt.latitude}&mlon=${evt.longitude}#map=16/${evt.latitude}/${evt.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:underline ml-2"
                  >
                    Open in Map
                  </a>
                </div>
                <div className="text-xs text-slate-400">
                  Triggered: {new Date(evt.created_at).toLocaleString()}
                  {evt.battery_level && ` • Device Battery: ${evt.battery_level}%`}
                </div>
              </div>

              {evt.status === 'ACTIVE' && (
                <button
                  onClick={() => handleResolve(evt.id)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/30"
                >
                  Mark as Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
