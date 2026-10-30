import React, { useState, useEffect } from 'react';

interface AdminDashboardViewProps {
  currentUser: any;
  onLogout: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ currentUser, onLogout }) => {
  const [stats, setStats] = useState<any>(null);
  const [guides, setGuides] = useState<any[]>([]);
  const [sosLogs, setSosLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('routemate_token');
      const res = await fetch('/api/v1/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setGuides(data.guides);
        setSosLogs(data.recentSos);
      }
    } catch (err) {
      console.error('Admin overview error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyGuide = async (guideId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const token = localStorage.getItem('routemate_token');
      const res = await fetch('/api/v1/admin/verify-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ guideId, action })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        loadAdminData();
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err: any) {
      console.error('Verify guide error:', err);
    }
  };

  const handleSeedDevData = async () => {
    try {
      const res = await fetch('/api/v1/dev/seed', { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message);
      loadAdminData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Seed error:', err);
    }
  };

  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/v1/dev/clear', { method: 'POST' });
      const data = await res.json();
      setActionNotice(data.message);
      loadAdminData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fcf9f3]">
      <div className="px-4 pt-3 pb-6 flex flex-col gap-3.5">
        {/* Header */}
        <div className="bg-[#032517] text-white rounded-xl p-4 shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[#c7ebd4] text-[10px] uppercase tracking-wider font-bold">
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Command Dispatch</span>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">RouteMate Dispatch Portal</h1>
            <p className="text-[11px] text-[#83a590]">
              Logged in as {currentUser?.fullName} ({currentUser?.email})
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 bg-[#1b3b2b] hover:bg-[#ba1a1a] text-white text-xs font-semibold rounded-lg border border-[#abcfb8]/30 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {actionNotice && (
          <div className="p-2.5 rounded-lg bg-[#c7ebd4] text-[#002113] text-xs font-bold border border-[#abcfb8]">
            ✓ {actionNotice}
          </div>
        )}

        {/* Live Metrics Grid */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#424843]">Connecting to database...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] flex flex-col">
                <span className="text-[10px] text-[#424843]">Registered Travellers</span>
                <span className="text-xl font-bold text-[#032517] font-mono mt-1">
                  {stats?.totalTravellers || 0}
                </span>
                <span className="text-[9px] text-[#555f71]">Active in database</span>
              </div>

              <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] flex flex-col">
                <span className="text-[10px] text-[#424843]">Registered Guides</span>
                <span className="text-xl font-bold text-[#032517] font-mono mt-1">
                  {stats?.totalGuides || 0}
                </span>
                <span className="text-[9px] text-[#032517] font-bold">
                  {stats?.verifiedGuides || 0} Verified • {stats?.pendingVerifications || 0} Pending
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] flex flex-col">
                <span className="text-[10px] text-[#424843]">Route Memories</span>
                <span className="text-xl font-bold text-[#ea841a] font-mono mt-1">
                  {stats?.routeMemoriesActive || 0}
                </span>
                <span className="text-[9px] text-[#424843]">Field user reports</span>
              </div>

              <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] flex flex-col">
                <span className="text-[10px] text-[#424843]">Emergency SOS Alerts</span>
                <span className="text-xl font-bold text-[#ba1a1a] font-mono mt-1">
                  {stats?.emergencyAlertsCount || 0}
                </span>
                <span className="text-[9px] text-[#ba1a1a] font-bold">Recorded logs</span>
              </div>
            </div>

            {/* Guides Verification Queue */}
            <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1c1c18]">Guide Credential Verification Queue</span>
                <span className="text-[10px] text-[#424843] font-mono">{guides.length} total</span>
              </div>

              {guides.length === 0 ? (
                <p className="text-xs text-[#555f71] italic py-2">
                  No guide accounts registered in the database yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {guides.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg bg-[#f6f3ed] flex flex-col gap-2 border border-[#e5e2dc] text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-[#1c1c18]">{g.fullName}</p>
                          <p className="text-[10px] text-[#424843]">{g.email} • {g.phone || 'No phone'}</p>
                          <p className="text-[11px] text-[#032517] mt-0.5">
                            Specialty: {g.specialty || 'General Navigator'} ({g.coverageRadiusKm || 15} km)
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono ${
                            g.verificationStatus === 'VERIFIED'
                              ? 'bg-[#c7ebd4] text-[#002113]'
                              : g.verificationStatus === 'REJECTED'
                              ? 'bg-[#ffdad6] text-[#93000a]'
                              : 'bg-[#ffdcc3] text-[#6e3900]'
                          }`}
                        >
                          {g.verificationStatus}
                        </span>
                      </div>

                      {g.verificationStatus === 'PENDING' && (
                        <div className="flex gap-2 pt-1 border-t border-[#e5e2dc]">
                          <button
                            type="button"
                            onClick={() => handleVerifyGuide(g.id, 'APPROVE')}
                            className="flex-1 py-1.5 bg-[#032517] hover:bg-[#1b3b2b] text-white rounded text-xs font-bold"
                          >
                            Approve &amp; Verify
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerifyGuide(g.id, 'REJECT')}
                            className="flex-1 py-1.5 bg-[#f1eee7] hover:bg-[#ffdad6] text-[#93000a] rounded text-xs font-bold border border-[#c1c8c2]"
                          >
                            Reject Application
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency SOS Alerts List */}
            <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex flex-col gap-2">
              <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">crisis_alert</span>
                Recorded Emergency Distress Signals
              </span>

              {sosLogs.length === 0 ? (
                <p className="text-xs text-[#555f71] italic py-1">
                  No active emergency distress signals registered.
                </p>
              ) : (
                sosLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded bg-[#ffdad6] text-[#93000a] text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>{log.userName}</span>
                      <span className="font-mono">{new Date(log.activatedAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[10px] mt-0.5 font-mono">
                      GPS: {log.latitude ? `${log.latitude}°, ${log.longitude}°` : 'Location unavailable'}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Database Test Controls (For Live Testing) */}
            <div className="p-3 bg-[#f1eee7] rounded-xl border border-[#c1c8c2] flex flex-col gap-2 text-xs">
              <span className="font-bold text-[#032517]">Live Testing Tools</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSeedDevData}
                  className="flex-1 py-1.5 bg-white border border-[#c1c8c2] text-[#032517] rounded text-xs font-semibold hover:bg-[#ebe8e2]"
                >
                  Seed Demo Accounts
                </button>
                <button
                  type="button"
                  onClick={handleResetDb}
                  className="flex-1 py-1.5 bg-white border border-[#ba1a1a] text-[#ba1a1a] rounded text-xs font-semibold hover:bg-[#ffdad6]"
                >
                  Clear DB to Empty
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
