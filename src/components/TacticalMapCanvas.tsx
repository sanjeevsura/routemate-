import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ThreeTerrainViewer } from './ThreeTerrainViewer';

interface TacticalMapCanvasProps {
  onGuideSelect?: (guideId: string) => void;
  onHazardSelect?: (hazardId: string) => void;
  initialCenter?: [number, number];
  zoom?: number;
  show3DByDefault?: boolean;
}

export const TacticalMapCanvas: React.FC<TacticalMapCanvasProps> = ({
  onGuideSelect,
  onHazardSelect,
  initialCenter = [10.0245, 77.2185], // Bodimettu Pass
  zoom = 13,
  show3DByDefault = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [show3D, setShow3D] = useState(show3DByDefault);
  const [layerType, setLayerType] = useState<'topo' | 'satellite' | 'radar'>('topo');
  const [needleAngle, setNeedleAngle] = useState(34);
  const [gpsLocked, setGpsLocked] = useState(true);

  useEffect(() => {
    if (show3D || !mapContainerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // OpenStreetMap standard tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // Route coordinates: Theni -> Bodimettu -> Munnar
    const routeCoords: [number, number][] = [
      [10.0102, 77.4768], // Theni
      [10.0094, 77.3482], // Bodi Foothills
      [10.0192, 77.2341], // Curve 14 Washout
      [10.0241, 77.2185], // Bodimettu Pass Summit
      [10.0450, 77.1650], // Forest Ranger Post
      [10.0650, 77.1120], // Devikulam
      [10.0889, 77.0595]  // Munnar
    ];

    // Background track shadow
    L.polyline(routeCoords, {
      color: '#1b3b2b',
      weight: 6,
      opacity: 0.6,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Glowing Amber primary route segment
    L.polyline(routeCoords.slice(2, 5), {
      color: '#ea841a',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Custom Current Position Marker (Rahul - 34 km/h)
    const travelerIcon = L.divIcon({
      className: 'custom-gps-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="absolute w-10 h-10 rounded-full bg-[#1b3b2b]/25 animate-ping"></div>
          <div class="w-7 h-7 rounded-full bg-[#032517] text-white flex items-center justify-center shadow-lg border-2 border-[#c7ebd4]">
            <span class="material-symbols-outlined text-[16px] -rotate-45">navigation</span>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const travelerMarker = L.marker([10.0210, 77.2280], { icon: travelerIcon }).addTo(map);
    travelerMarker.bindPopup(`
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #032517;">
        <strong>You (Rahul Sharma)</strong><br />
        Speed: 34 km/h • Bearing: 284° WNW<br />
        Elevation: 1,480m MSL
      </div>
    `);

    // Hazard Marker (Collapsed Shoulder curve 14)
    const hazardIcon = L.divIcon({
      className: 'custom-hazard-marker',
      html: `
        <div class="flex items-center gap-1 bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full shadow-md text-[10px] font-bold whitespace-nowrap cursor-pointer hover:scale-105 transition-transform">
          <span class="material-symbols-outlined text-[12px]">warning</span>
          <span>Curve 14 Hazard</span>
        </div>
      `,
      iconSize: [120, 24],
      iconAnchor: [60, 12]
    });

    const hazardMarker = L.marker([10.0192, 77.2341], { icon: hazardIcon }).addTo(map);
    hazardMarker.on('click', () => {
      if (onHazardSelect) onHazardSelect('mem-14-washout');
    });

    // Nearby Guide Marker (Arun Kumar)
    const guideIcon = L.divIcon({
      className: 'custom-guide-marker',
      html: `
        <div class="flex items-center gap-1.5 bg-[#ffffff] text-[#032517] py-0.5 px-2 rounded-full shadow-md border border-[#c7ebd4] text-[10px] font-bold cursor-pointer hover:scale-105 transition-transform">
          <span class="w-2 h-2 rounded-full bg-[#032517] animate-pulse"></span>
          <span>Arun K. (3.2km)</span>
        </div>
      `,
      iconSize: [110, 24],
      iconAnchor: [55, 12]
    });

    const guideMarker = L.marker([10.0245, 77.2185], { icon: guideIcon }).addTo(map);
    guideMarker.on('click', () => {
      if (onGuideSelect) onGuideSelect('guide-arun');
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [show3D, initialCenter, zoom, onGuideSelect, onHazardSelect]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(initialCenter, 14);
    }
    setNeedleAngle(prev => (prev === 34 ? 0 : 34));
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#e5e2dc]">
      {show3D ? (
        <ThreeTerrainViewer onClose={() => setShow3D(false)} />
      ) : (
        <>
          {/* Topographic Contour Overlay Line Art */}
          <div className="absolute inset-0 z-10 pointer-events-none opacity-30">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 400">
              <path d="M-50,60 Q80,120 180,40 T380,110 T520,30" fill="none" stroke="#2D4D3C" strokeDasharray="3,3" strokeWidth="1.2" />
              <path d="M-40,110 Q90,180 200,90 T390,160 T510,90" fill="none" stroke="#2D4D3C" strokeWidth="1" />
              <path d="M-30,170 Q110,230 210,150 T410,220 T530,140" fill="none" stroke="#2D4D3C" strokeWidth="1.4" />
              <path d="M-20,240 Q130,290 230,210 T420,280 T540,200" fill="none" stroke="#2D4D3C" strokeWidth="1" />
              <path d="M-10,310 Q140,360 250,280 T430,340 T550,270" fill="none" stroke="#2D4D3C" strokeDasharray="2,2" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Leaflet DOM Node */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Tactical Elevation & Bearing Telemetry Strip (Top Left) */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-[#032517] shadow-md border border-[#c1c8c2]">
              <span className="material-symbols-outlined text-[15px] text-[#ea841a]">landscape</span>
              <span className="text-[11px] font-bold font-mono">1,480m MSL</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-[#424843] shadow-md border border-[#c1c8c2]">
              <span className="material-symbols-outlined text-[15px] text-[#032517]">navigation</span>
              <span className="text-[11px] font-semibold truncate max-w-[130px]">NH85 → Munnar</span>
            </div>
          </div>

          {/* Tactical Right Rail Controls */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Azimuth Compass */}
            <button
              onClick={handleRecenter}
              aria-label="Align Map North"
              className="w-10 h-10 rounded-xl bg-white text-[#032517] shadow-md border border-[#c1c8c2] flex flex-col items-center justify-center active:scale-95 transition-transform"
            >
              <span
                className="material-symbols-outlined text-[20px] text-[#ba1a1a] transition-transform duration-300"
                style={{ transform: `rotate(${needleAngle}deg)` }}
              >
                explore
              </span>
              <span className="text-[8px] font-bold text-[#424843] -mt-1 font-mono">
                N {String(needleAngle).padStart(3, '0')}°
              </span>
            </button>

            {/* 3D Terrain Switcher */}
            <button
              onClick={() => setShow3D(true)}
              className="w-10 h-10 rounded-xl bg-[#1b3b2b] text-[#c7ebd4] shadow-md flex items-center justify-center hover:bg-[#032517] active:scale-95 transition-all"
              title="Open 3D Mountain Mesh"
            >
              <span className="material-symbols-outlined text-[20px]">view_in_ar</span>
            </button>

            {/* Layer Toggle Switch */}
            <div className="flex flex-col rounded-xl bg-white shadow-md border border-[#c1c8c2] overflow-hidden p-0.5">
              <button
                onClick={() => setLayerType('topo')}
                className={`w-9 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  layerType === 'topo' ? 'bg-[#c7ebd4] text-[#002113]' : 'text-[#555f71]'
                }`}
                title="Topographic Contours"
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
              </button>
              <button
                onClick={() => setLayerType('satellite')}
                className={`w-9 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  layerType === 'satellite' ? 'bg-[#c7ebd4] text-[#002113]' : 'text-[#555f71]'
                }`}
                title="Satellite Relief"
              >
                <span className="material-symbols-outlined text-[18px]">terrain</span>
              </button>
            </div>

            {/* Offline Cache Health Indicator */}
            <div className="px-2 py-1 rounded-xl bg-white shadow-md border border-[#c1c8c2] flex items-center gap-1.5 text-[#032517]">
              <span className="material-symbols-outlined text-[14px]">download_done</span>
              <div className="flex flex-col">
                <span className="text-[8px] text-[#555f71] leading-none">CACHE</span>
                <span className="text-[9px] font-bold font-mono">142MB</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
