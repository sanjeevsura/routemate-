import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onInitializationComplete: (user: any | null, initialGps: { lat: number; lon: number } | null, gpsError: string | null) => void;
}

const JOURNEY_QUOTES = [
  '"Not all those who wander are lost." — J.R.R. Tolkien',
  '"When the map doesn\'t know the way, a person who does can help." — RouteMate',
  '"A journey of a thousand miles begins with a single step." — Lao Tzu',
  '"Every path tells a story when guided by local wisdom."',
  '"Travel far enough to discover the world and yourself."',
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onInitializationComplete }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % JOURNEY_QUOTES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function runStartupChecks() {
      try {
        // Step 1: Health check (silent)
        await fetch('/api/v1/health').catch(() => null);

        // Step 2: Check stored session token (silent)
        const storedToken = localStorage.getItem('routemate_token');
        let authenticatedUser = null;

        if (storedToken) {
          try {
            const meRes = await fetch('/api/v1/auth/me', {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              if (meData.user) authenticatedUser = meData.user;
            } else {
              localStorage.removeItem('routemate_token');
            }
          } catch {
            localStorage.removeItem('routemate_token');
          }
        }

        // Step 3: Check Geolocation permission (silent)
        let acquiredGps: { lat: number; lon: number } | null = null;
        let gpsErr: string | null = null;

        if ('geolocation' in navigator) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                acquiredGps = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                resolve();
              },
              (err) => {
                gpsErr = err.message || 'GPS location permission denied';
                resolve();
              },
              { timeout: 3000, enableHighAccuracy: true }
            );
          });
        }

        setTimeout(() => {
          if (!isCancelled) {
            onInitializationComplete(authenticatedUser, acquiredGps, gpsErr);
          }
        }, 1800);
      } catch (err: any) {
        console.error('Startup check failed:', err);
        setErrorNotice(err.message || 'Unable to connect to RouteMate services');
      }
    }

    runStartupChecks();

    return () => {
      isCancelled = true;
    };
  }, [onInitializationComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#032517] text-white flex flex-col items-center justify-between p-8 select-none">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center max-w-sm">
        {/* Sleek Dual-Layer Glowing RouteMate Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-[#10B981]/15 animate-ping"></div>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0F4D32] to-[#032517] border border-[#34D399]/40 flex items-center justify-center shadow-2xl p-2 relative">
            <span className="material-symbols-outlined text-[36px] text-[#34D399]/30 absolute">navigation</span>
            <span className="material-symbols-outlined text-[32px] text-white relative z-10">explore</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-tight text-white font-headline">
            RouteMate
          </h1>
          <p className="text-[11px] text-[#34D399] tracking-widest font-semibold uppercase mt-1">
            Offline-First Human Navigation
          </p>
        </div>

        {/* Clean Buffering Symbol (Spinning Ring) */}
        <div className="mt-4 flex items-center justify-center">
          {errorNotice ? (
            <div className="p-3 rounded-lg bg-[#ba1a1a]/80 text-white text-xs">
              <span className="font-bold block mb-1">Initialization Notice</span>
              {errorNotice}
              <button
                type="button"
                onClick={() => onInitializationComplete(null, null, errorNotice)}
                className="mt-2 px-3 py-1 bg-white text-[#93000a] rounded font-bold text-[11px]"
              >
                Continue to Login
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-full bg-white/5 border border-[#34D399]/20 shadow-inner">
              <div className="w-6 h-6 rounded-full border-2 border-[#34D399] border-t-transparent animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Inspirational Rotating Journey Quotes */}
      <div className="w-full max-w-md text-center pb-4">
        <p className="text-xs text-white/80 italic min-h-[36px] transition-all duration-500 flex items-center justify-center px-4">
          {JOURNEY_QUOTES[quoteIndex]}
        </p>
        <span className="text-[10px] text-[#34D399]/60 font-mono tracking-widest block mt-2 uppercase">
          HUMAN GUIDED ROUTE EXPLORATION
        </span>
      </div>
    </div>
  );
};
