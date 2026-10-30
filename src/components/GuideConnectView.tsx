import React, { useState, useEffect } from 'react';

interface GuideConnectViewProps {
  currentUser: any;
  currentGps: { lat: number; lon: number } | null;
  onStartSessionWithGuide: (guideId: string) => void;
}

export const GuideConnectView: React.FC<GuideConnectViewProps> = ({
  currentUser,
  currentGps,
  onStartSessionWithGuide
}) => {
  const [filter, setFilter] = useState<'all' | 'nearby' | 'remote'>('all');
  const [guides, setGuides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 30s Server Authoritative Request Modal
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [requestTimer, setRequestTimer] = useState(30);
  const [requestStatus, setRequestStatus] = useState<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TIMEOUT'>('PENDING');

  const fetchGuides = async () => {
    setIsLoading(true);
    try {
      const latParam = currentGps ? `&lat=${currentGps.lat}` : '';
      const lonParam = currentGps ? `&lon=${currentGps.lon}` : '';
      const res = await fetch(`/api/v1/guides?filter=${filter}&radius=15${latParam}${lonParam}`);
      const data = await res.json();
      if (data.guides) {
        setGuides(data.guides);
      }
    } catch (err) {
      console.error('Fetch guides failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, [filter, currentGps]);

  // Request countdown timer
  useEffect(() => {
    if (!activeRequest || requestStatus !== 'PENDING') return;

    if (requestTimer <= 0) {
      setRequestStatus('TIMEOUT');
      return;
    }

    const timer = setInterval(() => {
      setRequestTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRequest, requestTimer, requestStatus]);

  const initiateRequest = async (guideId: string) => {
    try {
      const storedToken = localStorage.getItem('routemate_token');
      const res = await fetch('/api/v1/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedToken}`
        },
        body: JSON.stringify({
          guideId,
          origin: currentGps ? `${currentGps.lat.toFixed(4)}, ${currentGps.lon.toFixed(4)}` : 'Current Location',
          destination: 'Selected Destination'
        })
      });
      const data = await res.json();
      if (data.success && data.request) {
        setActiveRequest(data.request);
        setRequestTimer(30);
        setRequestStatus('PENDING');
      } else {
        alert(data.error || 'Failed to dispatch request to guide.');
      }
    } catch (err) {
      console.error('Create request error:', err);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fcf9f3]">
      <div className="px-4 pt-3 pb-6 flex flex-col gap-3.5">
        {/* Header Panel */}
        <div className="bg-[#f1eee7] rounded-xl p-3.5 shadow-sm border border-[#e5e2dc]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[#032517] text-[18px]">alt_route</span>
              <span className="text-[10px] text-[#424843] uppercase tracking-wider font-bold truncate">
                Guide Discovery Engine
              </span>
            </div>
            <span className="text-[10px] bg-[#c7ebd4] text-[#002113] px-2 py-0.5 rounded-full font-bold">
              Database Queried
            </span>
          </div>

          <h1 className="text-lg font-bold text-[#032517] tracking-tight">
            Find Local &amp; Route-Experienced Help
          </h1>
          <p className="text-xs text-[#424843] mt-0.5">
            Querying registered and verified guides in the RouteMate database within your geographic corridor.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#f1eee7] rounded-lg border border-[#c1c8c2]/50">
          <button
            onClick={() => setFilter('all')}
            className={`py-1.5 px-1 text-center rounded-md text-xs transition-all ${
              filter === 'all'
                ? 'bg-[#032517] text-white font-bold shadow-sm'
                : 'text-[#424843] hover:text-[#1c1c18] font-medium'
            }`}
          >
            All Guides
          </button>
          <button
            onClick={() => setFilter('nearby')}
            className={`py-1.5 px-1 text-center rounded-md text-xs transition-all ${
              filter === 'nearby'
                ? 'bg-[#032517] text-white font-bold shadow-sm'
                : 'text-[#424843] hover:text-[#1c1c18] font-medium'
            }`}
          >
            Nearby
          </button>
          <button
            onClick={() => setFilter('remote')}
            className={`py-1.5 px-1 text-center rounded-md text-xs transition-all ${
              filter === 'remote'
                ? 'bg-[#032517] text-white font-bold shadow-sm'
                : 'text-[#424843] hover:text-[#1c1c18] font-medium'
            }`}
          >
            Remote Experts
          </button>
        </div>

        {/* Guides List */}
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-2 text-xs text-[#424843]">
            <span className="w-6 h-6 rounded-full border-2 border-[#032517] border-t-transparent animate-spin"></span>
            <span>Querying verified guides from database...</span>
          </div>
        ) : guides.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-[#e5e2dc] text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#c1c8c2]">person_search</span>
            <h3 className="text-sm font-bold text-[#1c1c18]">No Verified Guides Registered Yet</h3>
            <p className="text-xs text-[#424843] max-w-xs">
              The database has zero verified guides matching this filter. Switch role to Guide to register an account, or log in as Admin to verify pending applications.
            </p>
          </div>
        ) : (
          guides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col border border-[#e5e2dc]"
            >
              <div
                className={`px-4 py-1.5 flex items-center justify-between text-xs font-semibold ${
                  guide.isRemoteExpert ? 'bg-[#d6e0f6] text-[#121c2c]' : 'bg-[#1b3b2b] text-white'
                }`}
              >
                <span className="text-[10px] tracking-wide uppercase font-bold">
                  {guide.isRemoteExpert ? 'Remote Route Analyst' : 'Verified Field Guide'}
                </span>
                <span className="text-[10px] font-mono">
                  {guide.calculatedDistanceKm ? `${guide.calculatedDistanceKm} km away` : 'Active'}
                </span>
              </div>

              <div className="p-3.5 flex flex-col gap-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#1c1c18]">{guide.name}</h2>
                    <p className="text-[11px] text-[#424843]">{guide.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#ffdcc3] text-[#6e3900] px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                    ★ {guide.rating || 5.0} ({guide.reviewCount || 0})
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap text-[10px]">
                  <span className="text-[#424843]">Languages:</span>
                  {(guide.languages || ['English']).map((lang: string, i: number) => (
                    <span key={i} className="bg-[#f1eee7] px-1.5 py-0.5 rounded text-[#1c1c18]">
                      {lang}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => initiateRequest(guide.id)}
                    className="flex-1 bg-[#1b3b2b] hover:bg-[#032517] text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
                    <span>Request Guidance (₹{guide.ratePerSessionInr})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartSessionWithGuide(guide.id)}
                    className="bg-[#f1eee7] hover:bg-[#ebe8e2] text-[#1c1c18] w-10 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[#c1c8c2]"
                    title="Direct Chat"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 30-Second Atomic Request Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4 border border-[#c1c8c2]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#032517]">Guidance Dispatch</h3>
              <button
                onClick={() => setActiveRequest(null)}
                className="w-7 h-7 rounded-full bg-[#f1eee7] flex items-center justify-center text-[#424843]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {requestStatus === 'PENDING' && (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <span className="text-2xl font-bold font-mono text-[#032517]">{requestTimer}s</span>
                <span className="text-xs text-[#424843]">
                  Waiting for guide response. The server will expire this request after 30 seconds.
                </span>
              </div>
            )}

            {requestStatus === 'ACCEPTED' && (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <span className="material-symbols-outlined text-[32px] text-[#032517]">check_circle</span>
                <h4 className="font-bold text-sm text-[#032517]">Guide Accepted!</h4>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequest(null);
                    onStartSessionWithGuide(activeRequest.guideId);
                  }}
                  className="w-full h-11 bg-[#032517] text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Join Guidance Session →
                </button>
              </div>
            )}

            {requestStatus === 'TIMEOUT' && (
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <span className="material-symbols-outlined text-[32px] text-[#ba1a1a]">timer_off</span>
                <h4 className="font-bold text-sm text-[#93000a]">Request Window Expired</h4>
                <p className="text-xs text-[#424843]">
                  The 30-second window closed with no answer from the guide.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
