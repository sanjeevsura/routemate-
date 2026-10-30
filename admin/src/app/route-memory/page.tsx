'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/api';
import { Compass, AlertTriangle, Check, Archive, RefreshCw } from 'lucide-react';

interface RouteMemoryItem {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  confirmations_count: number;
  cleared_reports_count: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING_REVIEW';
  created_at: string;
}

export default function RouteMemoryModerationPage() {
  const [items, setItems] = useState<RouteMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<RouteMemoryItem[]>('/admin/route-memory');
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Route Memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleArchive = async (id: string) => {
    try {
      await adminFetch(`/admin/route-memory/${id}/archive`, { method: 'POST' });
      fetchItems();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="w-7 h-7 text-indigo-400" />
            Route Memory Moderation
          </h1>
          <p className="text-sm text-slate-400 mt-1">Authoritative review of community crowd hazard markers</p>
        </div>
        <button
          onClick={fetchItems}
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
        <div className="p-12 text-center text-slate-400">Loading Route Memories...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-200">No Route Memories Reported</h3>
          <p className="text-sm text-slate-500 mt-1">Community hazards and insights will be listed here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold uppercase">
                    {item.category}
                  </span>
                  <span className="font-semibold text-white">{item.description}</span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                  <span>GPS: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</span>
                  <span>Confidence: {(item.confidence_score * 100).toFixed(0)}%</span>
                  <span className="text-emerald-400">+{item.confirmations_count} confirms</span>
                  <span className="text-red-400">-{item.cleared_reports_count} cleared</span>
                </div>
              </div>

              {item.status !== 'ARCHIVED' && (
                <button
                  onClick={() => handleArchive(item.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors border border-slate-700"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
