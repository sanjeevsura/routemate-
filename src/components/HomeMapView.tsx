import React, { useState, useEffect } from 'react';
import { TacticalMapCanvas } from './TacticalMapCanvas';

interface HomeMapViewProps {
  currentUser: any;
  currentGps: { lat: number; lon: number } | null;
  gpsError: string | null;
  onStartNavigation: (routeDetails: any) => void;
  onFindGuide: () => void;
  onSelectSos: () => void;
  onOpenMemory: (memoryId: string) => void;
}

export const HomeMapView: React.FC<HomeMapViewProps> = ({
  currentUser,
  currentGps,
  gpsError,
  onStartNavigation,
  onFindGuide,
  onSelectSos,
  onOpenMemory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [routeData, setRouteData] = useState<any | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Live Geocoding search from real Photon API
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/v1/geocoding/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute real route using OSRM when destination is selected
  const handleSelectPlace = async (place: any) => {
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setSearchResults([]);
    setRouteError(null);

    const fromLat = currentGps ? currentGps.lat : 10.0102;
    const fromLon = currentGps ? currentGps.lon : 77.4768;

    setIsComputingRoute(true);
    try {
      const res = await fetch(
        `/api/v1/routes/directions?from=${fromLat},${fromLon}&to=${place.latitude},${place.longitude}`
      );
      const data = await res.json();
      if (data.success) {
        setRouteData(data);
      } else {
        setRouteError(data.error || 'Failed to compute route to this destination.');
      }
    } catch (err: any) {
      setRouteError(`Routing failed: ${err.message}`);
    } finally {
      setIsComputingRoute(false);
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Top Greeting & Critical Status Row */}
      <div className="px-4 py-3 bg-[#fcf9f3] flex items-center justify-between gap-2 z-20 border-b border-[#e5e2dc]/60">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-base text-[#032517] tracking-tight truncate">
              Hello, {currentUser?.fullName || 'Traveller'}
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#032517]">verified</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                currentGps ? 'bg-[#032517] animate-pulse' : 'bg-[#ba1a1a]'
              }`}
            />
            <span className="text-[11px] text-[#424843] font-medium tracking-wide">
              {currentGps
                ? `GPS Active (${currentGps.lat.toFixed(4)}°, ${currentGps.lon.toFixed(4)}°)`
                : gpsError
                ? `GPS Notice: ${gpsError}`
                : 'Acquiring GPS fix...'}
            </span>
          </div>
        </div>

        {/* Persistent Tactical SOS Button */}
        <button
          onClick={onSelectSos}
          aria-label="Emergency SOS Alert"
          className="flex items-center gap-1 bg-[#ba1a1a] hover:bg-[#93000a] text-white px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[15px] font-bold">sos</span>
          <span className="text-[11px] font-bold tracking-wider uppercase font-mono">SOS</span>
        </button>
      </div>

      {/* Primary Cartographic Viewport Container */}
      <div className="relative w-full h-[360px] overflow-hidden select-none bg-[#e5e2dc]">
        <TacticalMapCanvas
          initialCenter={currentGps ? [currentGps.lat, currentGps.lon] : [10.0102, 77.4768]}
          onGuideSelect={() => onFindGuide()}
          onHazardSelect={onOpenMemory}
        />
      </div>

      {/* Bottom Interactive Field Drawer / Expedition Hub */}
      <div className="w-full bg-white rounded-t-2xl shadow-xl px-4 pt-3 pb-6 flex flex-col gap-3.5 z-20 -mt-2 border-t border-[#e5e2dc]">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-[#e5e2dc] rounded-full mx-auto"></div>

        {/* Search / Waypoint Destination Input */}
        <div className="relative w-full">
          <div className="flex items-center w-full h-12 bg-[#f1eee7] rounded-xl px-3 gap-2 border border-[#c1c8c2]/50 focus-within:border-[#032517] transition-colors">
            <span className="material-symbols-outlined text-[#032517] text-[20px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination, city or pass..."
              className="bg-transparent border-0 outline-none w-full text-sm text-[#1c1c18] placeholder:text-[#424843]/70 min-w-0"
            />
            {isSearching && (
              <span className="w-4 h-4 rounded-full border-2 border-[#032517] border-t-transparent animate-spin"></span>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-14 inset-x-0 bg-white rounded-xl shadow-2xl border border-[#c1c8c2] z-40 overflow-hidden divide-y divide-[#e5e2dc]">
              {searchResults.map((place, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-[#f1eee7] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#032517]">location_on</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1c1c18] truncate">{place.name}</p>
                    <p className="text-[10px] text-[#424843] truncate font-mono">
                      {place.formatted || place.state} ({place.latitude?.toFixed(3)}°, {place.longitude?.toFixed(3)}°)
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Real Route Calculation Telemetry */}
        {isComputingRoute ? (
          <div className="p-3.5 bg-[#f6f3ed] rounded-xl flex items-center justify-center gap-2 text-xs text-[#032517]">
            <span className="w-4 h-4 rounded-full border-2 border-[#032517] border-t-transparent animate-spin"></span>
            <span>Calculating live route via OSRM engine...</span>
          </div>
        ) : routeError ? (
          <div className="p-3 bg-[#ffdad6] text-[#93000a] rounded-xl text-xs flex items-center gap-2 border border-[#ffb4ab]">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{routeError}</span>
          </div>
        ) : routeData ? (
          <div className="p-3 bg-[#f6f3ed] rounded-xl flex items-center justify-between gap-2 border border-[#e5e2dc]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#abcfb8] text-[#032517] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[22px]">route</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#1c1c18] truncate">
                    {selectedPlace?.name || 'Selected Route'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#ffdcc3] text-[#6e3900] text-[10px] font-bold font-mono">
                    {routeData.distanceKm} km
                  </span>
                </div>
                <span className="text-[11px] text-[#424843] mt-0.5 font-mono">
                  Duration: {routeData.durationMin} min • {routeData.steps?.length || 0} maneuvers
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-[#f6f3ed] rounded-xl text-center text-xs text-[#555f71] border border-[#e5e2dc]">
            Search and select any destination to calculate real driving distance, turn-by-turn steps, and match route-experienced guides.
          </div>
        )}

        {/* Dual Action CTA Group */}
        <div className="grid grid-cols-12 gap-2.5 pt-0.5">
          <button
            type="button"
            onClick={onFindGuide}
            className="col-span-5 h-12 rounded-xl bg-[#ffdcc3] hover:bg-[#ffb77d] text-[#351800] flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm active:scale-[0.98] transition-transform"
          >
            <span className="material-symbols-outlined text-[19px]">person_pin_circle</span>
            <span className="truncate">Find Guide</span>
          </button>

          <button
            type="button"
            onClick={() => onStartNavigation(routeData)}
            className="col-span-7 h-12 rounded-xl bg-[#032517] hover:bg-[#1b3b2b] text-white flex items-center justify-center gap-2 text-xs font-bold shadow-md active:scale-[0.98] transition-all"
          >
            <span>Start Navigation</span>
            <span className="material-symbols-outlined text-[20px]">near_me</span>
          </button>
        </div>
      </div>
    </div>
  );
};
