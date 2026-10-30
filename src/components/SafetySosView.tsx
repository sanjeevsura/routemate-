import React, { useState } from 'react';

interface SafetySosViewProps {
  currentUser: any;
  currentGps: { lat: number; lon: number } | null;
  onLogout: () => void;
  onSosTriggered: () => void;
}

export const SafetySosView: React.FC<SafetySosViewProps> = ({
  currentUser,
  currentGps,
  onLogout,
  onSosTriggered
}) => {
  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleTriggerSos = async () => {
    setIsBroadcasting(true);
    setSosStatus(null);
    try {
      const token = localStorage.getItem('routemate_token');
      const res = await fetch('/api/v1/sos/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: currentGps?.lat,
          longitude: currentGps?.lon,
          elevationMsl: 1480
        })
      });
      const data = await res.json();
      setSosStatus(data.message || 'Distress signal recorded in database.');
      onSosTriggered();
    } catch (err: any) {
      setSosStatus(`Failed to broadcast SOS: ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fcf9f3]">
      <div className="px-4 pt-3 pb-6 flex flex-col gap-3.5">
        {/* Header */}
        <div className="bg-[#f1eee7] rounded-xl p-3.5 shadow-sm border border-[#e5e2dc]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#032517] uppercase tracking-wider font-bold">
              Expedition Safety Shield
            </span>
            <span className="text-[10px] bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded-full font-bold">
              Active Security
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#032517] tracking-tight">Safety &amp; SOS Center</h1>
          <p className="text-xs text-[#424843] mt-0.5">
            Emergency distress beacon, verified emergency contact alerts, and authenticated account management.
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#032517] text-white flex items-center justify-center font-bold text-sm">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#1c1c18]">{currentUser?.fullName}</span>
                <span className="text-[10px] bg-[#c7ebd4] text-[#002113] px-1.5 py-0.5 rounded font-mono font-bold">
                  {currentUser?.role}
                </span>
              </div>
              <span className="text-[11px] text-[#424843]">{currentUser?.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-2.5 py-1.5 rounded-lg bg-[#f1eee7] hover:bg-[#ffdad6] text-[#93000a] text-xs font-bold transition-colors border border-[#c1c8c2]"
          >
            Sign Out
          </button>
        </div>

        {/* SOS Emergency Broadcast Card */}
        <div className="bg-[#ffdad6] rounded-xl p-4 shadow-md flex flex-col gap-3 border border-[#ffb4ab]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold shadow">
              <span className="material-symbols-outlined text-[24px]">sos</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#93000a]">Emergency Distress Beacon</h2>
              <p className="text-[11px] text-[#93000a]/90">
                Dispatches GPS coordinates ({currentGps ? `${currentGps.lat.toFixed(4)}°, ${currentGps.lon.toFixed(4)}°` : 'Acquiring'}) to designated emergency contacts.
              </p>
            </div>
          </div>

          {sosStatus && (
            <div className="p-2.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-medium">
              ✓ {sosStatus}
            </div>
          )}

          <button
            type="button"
            onClick={handleTriggerSos}
            disabled={isBroadcasting}
            className="w-full h-12 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all font-mono"
          >
            <span className="material-symbols-outlined text-[20px]">emergency_share</span>
            <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Emergency SOS'}</span>
          </button>
        </div>

        {/* Real Emergency Contact in Profile */}
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex flex-col gap-2.5">
          <span className="text-xs font-bold text-[#1c1c18]">Your Designated Emergency Contact</span>

          {currentUser?.emergencyContactName && currentUser?.emergencyContactPhone ? (
            <div className="p-2.5 rounded-lg bg-[#f6f3ed] flex items-center justify-between text-xs border border-[#e5e2dc]">
              <div>
                <h4 className="font-bold text-[#1c1c18]">{currentUser.emergencyContactName}</h4>
                <span className="text-[10px] text-[#424843] font-mono">{currentUser.emergencyContactPhone}</span>
              </div>
              <span className="text-[10px] font-bold text-[#032517] bg-[#c7ebd4] px-2 py-0.5 rounded-full">
                Primary Kin
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#f6f3ed] text-xs text-[#555f71] italic">
              No emergency contact configured in your profile. You can specify kin contacts when registering.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
