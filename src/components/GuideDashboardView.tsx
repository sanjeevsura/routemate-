import React, { useState, useEffect } from 'react';

interface GuideDashboardViewProps {
  user: any;
  onLogout: () => void;
  onStartSession: (sessionId: string) => void;
}

export const GuideDashboardView: React.FC<GuideDashboardViewProps> = ({
  user,
  onLogout,
  onStartSession
}) => {
  const [isAvailable, setIsAvailable] = useState(user.isAvailable || false);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Poll for requests and sessions directed at this guide
  useEffect(() => {
    let isCancelled = false;

    async function checkActivity() {
      try {
        const storedToken = localStorage.getItem('routemate_token');
        if (!storedToken) return;

        // Fetch current user details to check verification updates
        const meRes = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user && !isCancelled) {
            setIsAvailable(meData.user.isAvailable || false);
          }
        }
      } catch (err) {
        console.error('Error polling guide activity:', err);
      }
    }

    checkActivity();
    const interval = setInterval(checkActivity, 5000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [refreshKey]);

  const handleRespondRequest = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      const storedToken = localStorage.getItem('routemate_token');
      const res = await fetch(`/api/v1/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success && data.session) {
        onStartSession(data.session.id);
      }
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error responding to request:', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fcf9f3]">
      <div className="px-4 pt-3 pb-6 flex flex-col gap-3.5">
        {/* Guide Header */}
        <div className="bg-[#032517] text-white rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1b3b2b] border border-[#abcfb8]/40 flex items-center justify-center font-bold text-sm text-[#c7ebd4]">
              {user.fullName ? user.fullName.charAt(0) : 'G'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white">{user.fullName}</h1>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    user.verificationStatus === 'VERIFIED'
                      ? 'bg-[#c7ebd4] text-[#002113]'
                      : 'bg-[#ffdcc3] text-[#6e3900]'
                  }`}
                >
                  {user.verificationStatus || 'PENDING'}
                </span>
              </div>
              <p className="text-[11px] text-[#abcfb8] mt-0.5 truncate max-w-[200px]">
                {user.specialty || 'Field Navigator'} • {user.coverageRadiusKm || 15} km coverage
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-[#1b3b2b] hover:bg-[#ba1a1a] text-white transition-colors"
            title="Log Out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>

        {/* Verification Status Warning if Pending */}
        {user.verificationStatus !== 'VERIFIED' && (
          <div className="p-3.5 rounded-xl bg-[#ffdcc3] text-[#6e3900] border border-[#ea841a]/40 flex items-start gap-2 text-xs">
            <span className="material-symbols-outlined text-[20px] text-[#ea841a] shrink-0">pending_actions</span>
            <div>
              <span className="font-bold block mb-0.5">Application Under Review</span>
              <p className="text-[11px] leading-relaxed">
                Your guide credential application is currently being reviewed by RouteMate Dispatch. You will become discoverable in traveller searches as soon as an administrator verifies your coverage details.
              </p>
            </div>
          </div>
        )}

        {/* Availability Toggle */}
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isAvailable && user.verificationStatus === 'VERIFIED'
                  ? 'bg-[#032517] animate-pulse'
                  : 'bg-[#555f71]'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-[#1c1c18]">Guide Dispatch Availability</span>
              <span className="text-[10px] text-[#424843] block">
                {user.verificationStatus !== 'VERIFIED'
                  ? 'Verification required before going online'
                  : isAvailable
                  ? 'Ready to accept incoming traveller guidance requests'
                  : 'Currently set to offline'}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={user.verificationStatus !== 'VERIFIED'}
            onClick={() => setIsAvailable(!isAvailable)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 ${
              isAvailable
                ? 'bg-[#032517] text-white'
                : 'bg-[#f1eee7] text-[#424843] border border-[#c1c8c2]'
            }`}
          >
            {isAvailable ? 'AVAILABLE' : 'OFFLINE'}
          </button>
        </div>

        {/* Guide Stats Cards */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] text-center">
            <span className="text-[10px] text-[#424843]">Completed</span>
            <span className="text-base font-bold text-[#032517] font-mono block mt-0.5">
              {user.verifiedTrips || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] text-center">
            <span className="text-[10px] text-[#424843]">Rating</span>
            <span className="text-base font-bold text-[#ea841a] font-mono block mt-0.5">
              {user.rating || 5.0} ★
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white shadow-sm border border-[#e5e2dc] text-center">
            <span className="text-[10px] text-[#424843]">Session Rate</span>
            <span className="text-base font-bold text-[#032517] font-mono block mt-0.5">
              ₹{user.ratePerSessionInr || 150}
            </span>
          </div>
        </div>

        {/* Incoming Requests Box */}
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex flex-col gap-2.5">
          <span className="text-xs font-bold text-[#1c1c18] flex items-center justify-between">
            <span>Incoming Assistance Requests</span>
            <span className="text-[10px] text-[#424843] font-mono">Real-time Telemetry</span>
          </span>

          {incomingRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#555f71]">
              <span className="material-symbols-outlined text-[28px] text-[#c1c8c2] block mx-auto mb-1">
                radar
              </span>
              No pending traveller requests right now. When a traveller in your {user.coverageRadiusKm || 15} km corridor requests guidance, an alert with a 30-second countdown will appear here.
            </div>
          ) : (
            incomingRequests.map((req) => (
              <div key={req.id} className="p-3 rounded-lg bg-[#f6f3ed] border border-[#e5e2dc] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#032517]">{req.travellerName}</span>
                  <span className="font-mono text-[#ea841a] font-bold">₹{req.offeredPriceInr}</span>
                </div>
                <p className="text-[11px] text-[#424843]">
                  Route: {req.originName} → {req.destinationName}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRespondRequest(req.id, 'ACCEPT')}
                    className="py-1.5 bg-[#032517] text-white rounded text-xs font-bold"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespondRequest(req.id, 'DECLINE')}
                    className="py-1.5 bg-[#f1eee7] text-[#424843] rounded text-xs font-bold border border-[#c1c8c2]"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
