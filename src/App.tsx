import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { HomeMapView } from './components/HomeMapView';
import { ExpeditionTrackerView } from './components/ExpeditionTrackerView';
import { GuideConnectView } from './components/GuideConnectView';
import { RouteMemoryView } from './components/RouteMemoryView';
import { TripsPackView } from './components/TripsPackView';
import { SafetySosView } from './components/SafetySosView';
import { GuideDashboardView } from './components/GuideDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';

type TabDestination = 'home-map' | 'trips-pack' | 'route-memory' | 'guide-connect' | 'profile-safety';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabDestination>('home-map');
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeRouteDetails, setActiveRouteDetails] = useState<any | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [sosAlertBanner, setSosAlertBanner] = useState(false);

  const handleInitializationComplete = (
    user: any | null,
    initialGps: { lat: number; lon: number } | null,
    err: string | null
  ) => {
    setCurrentUser(user);
    if (initialGps) setCurrentGps(initialGps);
    if (err) setGpsError(err);
    setIsInitializing(false);
  };

  const handleAuthSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    setActiveTab('home-map');
  };

  const handleLogout = () => {
    localStorage.removeItem('routemate_token');
    setCurrentUser(null);
    setIsNavigating(false);
    setActiveRouteDetails(null);
  };

  const handleStartNavigation = (routeDetails: any) => {
    setActiveRouteDetails(routeDetails);
    setIsNavigating(true);
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
  };

  const handleSosTriggered = () => {
    setSosAlertBanner(true);
    setTimeout(() => setSosAlertBanner(false), 8000);
  };

  // 1. Splash Screen during real startup checks
  if (isInitializing) {
    return <SplashScreen onInitializationComplete={handleInitializationComplete} />;
  }

  // 2. Authentication Flow (Welcome / Login / Register / Role Selection)
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // 3. Authenticated Role: Guide Dashboard
  if (currentUser.role === 'GUIDE') {
    return (
      <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#e5e2dc]">
        <main className="flex-1 w-full flex flex-col">
          <GuideDashboardView
            user={currentUser}
            onLogout={handleLogout}
            onStartSession={() => setIsNavigating(true)}
          />
        </main>
      </div>
    );
  }

  // 4. Authenticated Role: Admin Dashboard
  if (currentUser.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#e5e2dc]">
        <main className="flex-1 w-full flex flex-col">
          <AdminDashboardView currentUser={currentUser} onLogout={handleLogout} />
        </main>
      </div>
    );
  }

  // 5. Authenticated Role: Traveller Application
  return (
    <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex flex-col justify-between max-w-md mx-auto shadow-2xl relative border-x border-[#e5e2dc]">
      {/* Top Application Header */}
      <header className="fixed top-0 inset-x-0 max-w-md mx-auto z-50 bg-[#fcf9f3]/95 backdrop-blur-xl border-b border-[#e5e2dc]/80 pt-safe">
        <div className="h-14 px-4 flex items-center justify-between gap-2">
          {/* Brand Left Lockup */}
          <div className="flex items-center gap-2 min-w-0">
            {isNavigating && (
              <button
                type="button"
                onClick={handleStopNavigation}
                aria-label="Exit Navigation"
                className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center text-[#1c1c18] hover:bg-[#e5e2dc]"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            )}

            <div className="w-7 h-7 bg-[#032517] rounded-lg flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[16px] text-[#c7ebd4]">explore</span>
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-[#032517] leading-tight truncate">
                RouteMate
              </span>
              <span className="text-[10px] text-[#424843] font-medium leading-none truncate">
                {isNavigating
                  ? 'Expedition Tracker'
                  : activeTab === 'home-map'
                  ? 'Home Map'
                  : activeTab === 'guide-connect'
                  ? 'Guide Connect'
                  : activeTab === 'route-memory'
                  ? 'Route Memory™'
                  : activeTab === 'trips-pack'
                  ? 'Trip Packs'
                  : 'Safety Hub'}
              </span>
            </div>
          </div>

          {/* Right Status Indicator & Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-1.5 py-0.5 px-2 rounded-full border text-[10px] font-bold font-mono transition-colors ${
                isOfflineMode
                  ? 'bg-[#ffdad6] text-[#93000a] border-[#ffb4ab]'
                  : 'bg-[#c7ebd4] text-[#002113] border-[#abcfb8]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOfflineMode ? 'bg-[#ba1a1a]' : 'bg-[#032517] animate-pulse'
                }`}
              />
              <span>{isOfflineMode ? 'OFFLINE' : 'ONLINE'}</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('profile-safety')}
              className="w-8 h-8 rounded-full bg-[#032517] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#c7ebd4]"
              title="User Profile & Safety Hub"
            >
              {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
            </button>
          </div>
        </div>

        {/* SOS Alert Ribbon */}
        {sosAlertBanner && (
          <div className="bg-[#ba1a1a] text-white text-xs px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] animate-pulse">crisis_alert</span>
              <span className="font-bold">Distress Signal Logged to Emergency Database!</span>
            </div>
            <button
              onClick={() => setSosAlertBanner(false)}
              className="text-white hover:underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}
      </header>

      {/* Main Screen Content Viewport */}
      <main className="flex-1 w-full pt-14 flex flex-col relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          {isNavigating ? (
            <motion.div
              key="expedition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <ExpeditionTrackerView
                currentUser={currentUser}
                currentGps={currentGps}
                routeDetails={activeRouteDetails}
                onBack={handleStopNavigation}
                onSosTriggered={handleSosTriggered}
                onOpenGuideConnect={() => {
                  handleStopNavigation();
                  setActiveTab('guide-connect');
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              {activeTab === 'home-map' && (
                <HomeMapView
                  currentUser={currentUser}
                  currentGps={currentGps}
                  gpsError={gpsError}
                  onStartNavigation={handleStartNavigation}
                  onFindGuide={() => setActiveTab('guide-connect')}
                  onSelectSos={() => setActiveTab('profile-safety')}
                  onOpenMemory={() => setActiveTab('route-memory')}
                />
              )}

              {activeTab === 'trips-pack' && (
                <TripsPackView
                  isOfflineMode={isOfflineMode}
                  onToggleOfflineMode={setIsOfflineMode}
                  onStartNavigation={() => handleStartNavigation(activeRouteDetails)}
                />
              )}

              {activeTab === 'route-memory' && (
                <RouteMemoryView currentUser={currentUser} currentGps={currentGps} />
              )}

              {activeTab === 'guide-connect' && (
                <GuideConnectView
                  currentUser={currentUser}
                  currentGps={currentGps}
                  onStartSessionWithGuide={() => setIsNavigating(true)}
                />
              )}

              {activeTab === 'profile-safety' && (
                <SafetySosView
                  currentUser={currentUser}
                  currentGps={currentGps}
                  onLogout={handleLogout}
                  onSosTriggered={handleSosTriggered}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Tab Bar */}
      {!isNavigating && (
        <nav
          className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-40 pb-safe bg-[#fcf9f3]/95 backdrop-blur-xl border-t border-[#e5e2dc]/90 shadow-[0_-2px_12px_rgba(27,59,43,0.06)]"
          aria-label="Expedition Tab Navigation"
        >
          <div className="flex justify-around items-center h-16 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('home-map')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-1 transition-colors ${
                activeTab === 'home-map' ? 'text-[#032517] font-bold' : 'text-[#555f71]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">explore</span>
              <span className="text-[10px] tracking-tight mt-0.5">Map</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trips-pack')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-1 transition-colors ${
                activeTab === 'trips-pack' ? 'text-[#032517] font-bold' : 'text-[#555f71]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">backpack</span>
              <span className="text-[10px] tracking-tight mt-0.5">Trips</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('route-memory')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-1 transition-colors ${
                activeTab === 'route-memory' ? 'text-[#032517] font-bold' : 'text-[#555f71]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">history_edu</span>
              <span className="text-[10px] tracking-tight mt-0.5">Memories</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide-connect')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-1 transition-colors ${
                activeTab === 'guide-connect' ? 'text-[#032517] font-bold' : 'text-[#555f71]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">handshake</span>
              <span className="text-[10px] tracking-tight mt-0.5">Guides</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile-safety')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-1 transition-colors ${
                activeTab === 'profile-safety' ? 'text-[#ba1a1a] font-bold' : 'text-[#555f71]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">shield_person</span>
              <span className="text-[10px] tracking-tight mt-0.5">Safety</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
