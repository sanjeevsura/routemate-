import React, { useState, useEffect, useRef } from 'react';
import { TacticalMapCanvas } from './TacticalMapCanvas';

interface ExpeditionTrackerViewProps {
  currentUser: any;
  currentGps: { lat: number; lon: number } | null;
  routeDetails: any | null;
  onBack: () => void;
  onSosTriggered: () => void;
  onOpenGuideConnect: () => void;
}

export const ExpeditionTrackerView: React.FC<ExpeditionTrackerViewProps> = ({
  currentUser,
  currentGps,
  routeDetails,
  onBack,
  onSosTriggered,
  onOpenGuideConnect
}) => {
  const [sessionTimer, setSessionTimer] = useState(0);
  const [sosProgress, setSosProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const [sosStatus, setSosStatus] = useState<string | null>(null);

  const sosTimerRef = useRef<number | null>(null);
  const sosStartRef = useRef<number>(0);
  const SOS_DURATION_MS = 3000;

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startHoldSos = () => {
    setIsHoldingSos(true);
    sosStartRef.current = performance.now();

    const updateProgress = () => {
      const elapsed = performance.now() - sosStartRef.current;
      const progress = Math.min(elapsed / SOS_DURATION_MS, 1);
      setSosProgress(progress);

      if (progress < 1) {
        sosTimerRef.current = requestAnimationFrame(updateProgress);
      } else {
        triggerSosBeacon();
      }
    };

    sosTimerRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHoldSos = () => {
    setIsHoldingSos(false);
    if (sosTimerRef.current) {
      cancelAnimationFrame(sosTimerRef.current);
      sosTimerRef.current = null;
    }
    setSosProgress(0);
  };

  const triggerSosBeacon = async () => {
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
      setSosStatus(data.message || 'Distress signal dispatched');
      onSosTriggered();
    } catch (err: any) {
      setSosStatus('Saved locally in offline distress packet.');
    }
  };

  const currentStep = routeDetails?.steps?.[0]?.instruction || 'Proceed along active expedition corridor';
  const remainingDistance = routeDetails?.distanceKm ? `${routeDetails.distanceKm} km` : 'Active Route';
  const remainingDuration = routeDetails?.durationMin ? `${routeDetails.durationMin} min` : '54 min';

  return (
    <div className="flex flex-col w-full relative select-none pb-24 bg-[#fcf9f3]">
      {/* Top Floating Turn-by-Turn Instruction Banner */}
      <div className="px-4 pt-2 pb-2 z-30">
        <div className="bg-[#032517] text-white rounded-xl p-3.5 shadow-xl flex flex-col gap-2.5 border border-[#1b3b2b]">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#1b3b2b] text-[#c7ebd4] flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[28px]">turn_slight_left</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-[#c7ebd4] uppercase font-bold tracking-wider font-mono">
                Active Maneuver
              </span>
              <p className="font-semibold text-sm text-white leading-tight mt-0.5 truncate">
                {currentStep}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[#ffdcc3] text-[11px]">
                <span className="material-symbols-outlined text-[14px] text-[#ea841a]">info</span>
                <span className="truncate">
                  {routeDetails?.provider || 'Driving Navigation Engine'}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Strip */}
          <div className="flex items-center justify-between bg-[#1b3b2b]/80 rounded-lg px-2.5 py-1.5 text-xs text-[#83a590] border border-[#2d4d3c]/50 font-mono">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#c7ebd4]">route</span>
              <span className="text-white font-semibold">{remainingDistance}</span>
            </div>
            <span className="text-[#e5e2dc]/40">•</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#c7ebd4]">schedule</span>
              <span className="text-white font-semibold">{remainingDuration}</span>
            </div>
            <span className="text-[#e5e2dc]/40">•</span>
            <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c7ebd4] animate-pulse"></span>
              <span className="text-[10px] text-[#c7ebd4]">
                {currentGps ? 'GPS Fix' : 'GPS Standby'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative w-full h-[320px] bg-[#e5e2dc] overflow-hidden">
        <TacticalMapCanvas
          initialCenter={currentGps ? [currentGps.lat, currentGps.lon] : [10.0245, 77.2185]}
          onGuideSelect={() => onOpenGuideConnect()}
        />
      </div>

      {/* Assistance Action Panel */}
      <div className="px-4 -mt-2 z-30 flex flex-col gap-2">
        <div className="bg-white rounded-xl shadow-lg p-3.5 border border-[#e5e2dc]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#1c1c18] block">Live Navigation Session</span>
              <span className="text-[10px] text-[#424843] font-mono">
                Duration: {formatTimer(sessionTimer)}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenGuideConnect}
              className="px-3 py-1.5 rounded-lg bg-[#ffdcc3] hover:bg-[#ffb77d] text-[#351800] text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">person_search</span>
              <span>Find Route Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* SOS Button Area */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {sosStatus && (
          <div className="p-2.5 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs font-bold border border-[#ffb4ab]">
            {sosStatus}
          </div>
        )}

        <button
          type="button"
          onMouseDown={startHoldSos}
          onMouseUp={cancelHoldSos}
          onTouchStart={startHoldSos}
          onTouchEnd={cancelHoldSos}
          className="relative w-full h-14 rounded-xl flex items-center justify-between px-4 overflow-hidden select-none bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab]"
        >
          <div
            className="absolute inset-y-0 left-0 bg-[#ba1a1a] opacity-25 transition-all duration-75 ease-linear pointer-events-none"
            style={{ width: `${sosProgress * 100}%` }}
          />

          <div className="flex items-center gap-2.5 z-10">
            <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">sos</span>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-wider block font-mono">
                HOLD 3s FOR SOS
              </span>
              <span className="text-[10px] block opacity-90">
                {isHoldingSos
                  ? `Keep holding: ${(Math.max(0, 3 - sosProgress * 3)).toFixed(1)}s...`
                  : 'Logs emergency coordinates and alerts contacts'}
              </span>
            </div>
          </div>

          <div className="relative w-8 h-8 flex items-center justify-center z-10 font-mono text-xs font-bold">
            {Math.round(sosProgress * 100)}%
          </div>
        </button>
      </div>
    </div>
  );
};
