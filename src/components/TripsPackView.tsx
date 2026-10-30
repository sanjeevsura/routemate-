import React, { useState } from 'react';

interface TripsPackViewProps {
  isOfflineMode: boolean;
  onToggleOfflineMode: (offline: boolean) => void;
  onStartNavigation: () => void;
}

export const TripsPackView: React.FC<TripsPackViewProps> = ({
  isOfflineMode,
  onToggleOfflineMode,
  onStartNavigation
}) => {
  const [downloadProgress, setDownloadProgress] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);

  const packs = [
    {
      id: 'pack-western-ghats',
      title: 'Western Ghats Ridge & Munnar Pass',
      size: '142 MB',
      updated: 'Synced 2m ago',
      isReady: true,
      features: [
        'Vector Map Tiles (Z9 - Z16)',
        'Contour Elevation Graph (+1,220m)',
        '12 Offline Route Memories',
        'Forest Guard VHF Channels'
      ]
    },
    {
      id: 'pack-kodaikanal',
      title: 'Kodaikanal Ghat & Forest Bypass',
      size: '98 MB',
      updated: 'Available for sync',
      isReady: false,
      features: [
        'Vector Map Tiles (Z9 - Z15)',
        'Water point coordinates',
        'Hairpin bend advisory'
      ]
    }
  ];

  const handleDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fcf9f3]">
      <div className="px-4 pt-3 pb-6 flex flex-col gap-3.5">
        {/* Header */}
        <div className="bg-[#f1eee7] rounded-xl p-3.5 shadow-sm border border-[#e5e2dc]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#032517] uppercase tracking-wider font-bold">
              Expedition Preparation
            </span>
            <span className="text-[10px] bg-[#c7ebd4] text-[#002113] px-2 py-0.5 rounded-full font-bold">
              Trip Packs
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#032517] tracking-tight">Offline Trip Packs</h1>
          <p className="text-xs text-[#424843] mt-0.5">
            Download vector maps, elevation contour meshes, route memories, and guide contacts before entering zero-connectivity valleys.
          </p>
        </div>

        {/* Offline Mode Hardware Simulator Switch */}
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e5e2dc] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isOfflineMode ? 'bg-[#ba1a1a] text-white' : 'bg-[#c7ebd4] text-[#002113]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isOfflineMode ? 'cloud_off' : 'cloud_done'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#1c1c18]">Simulate Offline Mode</span>
              <span className="text-[10px] text-[#424843]">
                {isOfflineMode
                  ? 'Zero internet simulation active: running from local cache'
                  : 'Connected to RouteMate telemetry cloud'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleOfflineMode(!isOfflineMode)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              isOfflineMode ? 'bg-[#ba1a1a]' : 'bg-[#c1c8c2]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isOfflineMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Trip Packs List */}
        <div className="space-y-3">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-xl p-3.5 shadow-md flex flex-col gap-2.5 border border-[#e5e2dc]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1c1c18]">{pack.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#424843] font-mono">
                    <span className="font-bold text-[#032517]">{pack.size}</span>
                    <span>•</span>
                    <span>{pack.updated}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    pack.isReady
                      ? 'bg-[#c7ebd4] text-[#002113]'
                      : 'bg-[#ffdcc3] text-[#6e3900]'
                  }`}
                >
                  {pack.isReady ? 'READY' : 'DOWNLOAD'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-[#424843]">
                {pack.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#032517]">check</span>
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="pt-1">
                {pack.isReady ? (
                  <button
                    type="button"
                    onClick={onStartNavigation}
                    className="w-full h-10 bg-[#032517] hover:bg-[#1b3b2b] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">near_me</span>
                    <span>Launch Offline Navigation</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full h-10 bg-[#1b3b2b] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>{isDownloading ? `Syncing ${downloadProgress}%` : `Download (${pack.size})`}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
