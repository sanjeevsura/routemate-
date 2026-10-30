'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '../../lib/api';
import { Check, X, ShieldAlert, FileText, UserCheck, RefreshCw } from 'lucide-react';

interface PendingGuide {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  badge_number: string;
  id_document_url?: string;
  coverage_radius_km: number;
  experience_years: number;
  created_at: string;
}

export default function GuideVerificationPage() {
  const [guides, setGuides] = useState<PendingGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchPendingGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<PendingGuide[]>('/admin/guides/pending');
      setGuides(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingGuides();
  }, []);

  const handleVerify = async (guideId: string, approved: boolean) => {
    setActionInProgress(guideId);
    try {
      await adminFetch(`/admin/guides/${guideId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approved, reason: approved ? 'Documents verified' : 'Incomplete documentation' }),
      });
      // Remove from list upon successful verification
      setGuides((prev) => prev.filter((g) => g.id !== guideId));
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Guide Verification Queue</h1>
          <p className="text-sm text-slate-400 mt-1">Review government IDs and credential badges before authorizing guides</p>
        </div>
        <button
          onClick={fetchPendingGuides}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading pending verifications...</div>
      ) : guides.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-200">No Pending Applications</h3>
          <p className="text-sm text-slate-500 mt-1">All registered guides have been reviewed and processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-white">{guide.full_name}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Badge: {guide.badge_number || 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                  <span>Email: {guide.email}</span>
                  <span>Phone: {guide.phone || 'N/A'}</span>
                  <span>Experience: {guide.experience_years} years</span>
                  <span>Radius: {guide.coverage_radius_km} km</span>
                </div>
                {guide.id_document_url && (
                  <a
                    href={guide.id_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:underline mt-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Government ID / License Document
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVerify(guide.id, false)}
                  disabled={actionInProgress === guide.id}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleVerify(guide.id, true)}
                  disabled={actionInProgress === guide.id}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Approve Guide
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
