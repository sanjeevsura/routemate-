import React, { useState, useEffect } from 'react';
import { RouteMemory } from '../server/db';

interface RouteMemoryViewProps {
  currentUser: any;
  currentGps: { lat: number; lon: number } | null;
}

export const RouteMemoryView: React.FC<RouteMemoryViewProps> = ({
  currentUser,
  currentGps
}) => {
  const [memories, setMemories] = useState<RouteMemory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Add memory modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'HAZARD' | 'DETOUR' | 'SUPPLIES' | 'MEDICAL'>('HAZARD');
  const [newDescription, setNewDescription] = useState('');
  const [corridorName, setCorridorName] = useState('Active Expedition Track');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filterChips = [
    { label: 'All', key: 'ALL' },
    { label: 'Hazards', key: 'HAZARD' },
    { label: 'Detours', key: 'DETOUR' },
    { label: 'Supplies', key: 'SUPPLIES' },
    { label: 'Medical', key: 'MEDICAL' }
  ];

  const loadMemories = async () => {
    try {
      const res = await fetch(`/api/v1/route-memory?category=${activeCategory}`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('Load memories error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [activeCategory]);

  const handleConfirm = async (memoryId: string, action: 'STILL_THERE' | 'REPORT_CLEARED') => {
    try {
      const token = localStorage.getItem('routemate_token');
      const res = await fetch(`/api/v1/route-memory/${memoryId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setMemories(prev => prev.map(m => (m.id === memoryId ? data.memory : m)));
      }
    } catch (err) {
      console.error('Confirm error:', err);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const lat = currentGps ? currentGps.lat : 10.0245;
    const lon = currentGps ? currentGps.lon : 77.2185;

    try {
      const token = localStorage.getItem('routemate_token');
      const res = await fetch('/api/v1/route-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          description: newDescription,
          routeCorridor: corridorName,
          latitude: lat,
          longitude: lon,
          kilometerMarker: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        loadMemories();
      } else {
        setSubmitError(data.error || 'Failed to submit route memory');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#fcf9f3]">
      {/* Header */}
      <div className="px-4 pt-3 pb-3 bg-[#f6f3ed] border-b border-[#e5e2dc]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-[#424843] font-bold">
            Field-Sourced Logbook
          </span>
          <span className="text-[10px] bg-white text-[#032517] px-2 py-0.5 rounded-full font-mono border border-[#c1c8c2]">
            {memories.length} Active Records
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#032517] tracking-tight">Route Memory™</h1>
        <p className="text-xs text-[#424843] mt-0.5">
          Decentralized community-verified road intel: hazards, washouts, water sources, and bypasses stored directly in the database.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="w-full overflow-x-auto py-2 px-4 bg-[#f6f3ed] flex items-center gap-1.5 no-scrollbar border-b border-[#e5e2dc]">
        {filterChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveCategory(chip.key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeCategory === chip.key
                ? 'bg-[#032517] text-white shadow-sm'
                : 'bg-white text-[#424843] hover:bg-[#e5e2dc] border border-[#c1c8c2]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Memories Feed */}
      <div className="px-4 pt-3 flex flex-col gap-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#424843]">Loading Route Memories...</div>
        ) : memories.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-[#e5e2dc] text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-[#c1c8c2]">note_alt</span>
            <h3 className="text-sm font-bold text-[#1c1c18]">No Route Memories Recorded Yet</h3>
            <p className="text-xs text-[#424843] max-w-xs">
              Be the first traveller to report a road obstruction, water tap, or trail bypass in this area.
            </p>
          </div>
        ) : (
          memories.map((entry) => (
            <article
              key={entry.id}
              className="p-3.5 rounded-xl bg-white shadow-md flex flex-col gap-2 border border-[#e5e2dc]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-[#f1eee7] text-[#424843] text-[9px] uppercase font-bold font-mono">
                    {entry.category} • {entry.status}
                  </span>
                  <h3 className="text-xs font-bold text-[#1c1c18] mt-0.5">{entry.title}</h3>
                  <span className="text-[10px] text-[#424843] font-mono">{entry.routeCorridor}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#002113] bg-[#c7ebd4] px-2 py-0.5 rounded-full font-mono">
                    {entry.confidencePercent}% Conf.
                  </span>
                  <span className="text-[9px] text-[#424843] block mt-0.5 font-mono">
                    {entry.confirmations} confirms
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#1c1c18] leading-relaxed bg-[#f6f3ed] p-2 rounded-lg">
                {entry.description}
              </p>

              <div className="flex items-center justify-between text-[9px] text-[#424843] font-mono">
                <span>GPS: {entry.latitude?.toFixed(4)}°, {entry.longitude?.toFixed(4)}°</span>
                <span>Reported by {entry.reportedBy}</span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-[#e5e2dc]">
                <button
                  type="button"
                  onClick={() => handleConfirm(entry.id, 'STILL_THERE')}
                  className="flex-1 py-1.5 rounded-lg bg-[#032517] text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                  <span>Still There ({entry.confirmations})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirm(entry.id, 'REPORT_CLEARED')}
                  className="flex-1 py-1.5 rounded-lg bg-[#f1eee7] text-[#1c1c18] text-xs font-semibold border border-[#c1c8c2]"
                >
                  Report Cleared
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Floating Add Memory Button */}
      <div className="fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="pointer-events-auto h-12 px-5 rounded-full bg-[#032517] hover:bg-[#1b3b2b] text-white text-xs font-bold flex items-center gap-2 shadow-2xl active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[19px]">add_location_alt</span>
          <span>+ Add to Route Memory</span>
        </button>
      </div>

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full max-w-lg bg-white rounded-t-2xl p-5 shadow-2xl flex flex-col gap-3.5 border-t border-[#c1c8c2]">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#032517]">Drop Route Memory™</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f1eee7] flex items-center justify-center text-[#424843]"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {submitError && (
              <div className="p-2 rounded bg-[#ffdad6] text-[#93000a] text-xs">{submitError}</div>
            )}

            <form onSubmit={handleCreateMemory} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Category
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['HAZARD', 'DETOUR', 'SUPPLIES', 'MEDICAL'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`p-1.5 rounded-lg text-xs font-semibold border ${
                        newCategory === cat
                          ? 'bg-[#032517] text-white border-[#032517]'
                          : 'bg-[#f1eee7] text-[#1c1c18] border-[#c1c8c2]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Corridor / Trail Name
                </label>
                <input
                  type="text"
                  value={corridorName}
                  onChange={(e) => setCorridorName(e.target.value)}
                  placeholder="e.g. NH 85 Bodimettu Pass"
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Broken culvert after curve 14"
                  className="w-full px-3 py-2 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-[#424843] uppercase font-bold block mb-1">
                  Observation Note
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe obstruction, passable vehicle types, or water point details..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-[#f1eee7] text-xs text-[#1c1c18] border border-[#c1c8c2]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#032517] text-white rounded-lg text-xs font-bold shadow-md"
              >
                {isSubmitting ? 'Saving...' : 'Submit Route Memory to Database'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
