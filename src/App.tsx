import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useEffect, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { CosmicBackground } from './components/Effects/CosmicBackground';
import { Earth } from './components/Globe/Earth';
import { PlayerPanel } from './components/UI/PlayerPanel';
import { CameraManager } from './components/CameraManager';
import { StationList } from './components/UI/StationList';
import { LanguageToggle } from './components/UI/LanguageToggle';
import { CountryTooltip } from './components/UI/CountryTooltip';
import { AutoplayOverlay } from './components/UI/AutoplayOverlay';
import { useRadioStore } from './store/useRadioStore';
import type { Station } from './types/radio';
import { decodeStationId } from './utils/shareProtocol';

function App() {
  const { activeStation, selectedCountry, language, resolveStationById, playStation, stopStation } = useRadioStore();
  const [deepLinkStation, setDeepLinkStation] = useState<Station | null>(null);
  const [isDeepLinkLoading, setIsDeepLinkLoading] = useState(false);

  // Disable auto-rotate when interacting
  const shouldAutoRotate = !activeStation && !selectedCountry && !deepLinkStation && !isDeepLinkLoading;

  // Deep Link Handling
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('s');

    if (code) {
      setIsDeepLinkLoading(true); // Show "Searching..." immediately

      const stationId = decodeStationId(code);

      if (stationId) {
        resolveStationById(stationId).then((station) => {
          setIsDeepLinkLoading(false);
          if (station) {
            stopStation(); // Ensure no background audio from persisted state
            setDeepLinkStation(station);
            // URL will be cleaned on user interaction (Play/Close)
          } else {
            // Handle not found
          }
        });
      } else {
        setIsDeepLinkLoading(false);
      }
    }
  }, []); // Run once on mount

  // I18n for header
  const t = useMemo(() => ({
    en: { live: "LIVE", title: "Ear.th" },
    zh: { live: "实时直播", title: "聆听世界" }
  }), []);

  const dateStr = useMemo(() => {
    return new Date().toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US');
  }, [language]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">

      {/* Deep Link Overlay (Station Found OR Loading) */}
      {(deepLinkStation || isDeepLinkLoading) && (
        <AutoplayOverlay
          station={deepLinkStation}
          isSearching={isDeepLinkLoading}
          onPlay={() => {
            if (deepLinkStation) {
              playStation(deepLinkStation);
            }
            setDeepLinkStation(null);
            // Clean URL on play
            window.history.replaceState({}, '', window.location.pathname);
          }}
          onClose={() => {
            setDeepLinkStation(null);
            setIsDeepLinkLoading(false);
            // Clean URL on close
            window.history.replaceState({}, '', window.location.pathname);
          }}
        />
      )}

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: true }} camera={{ position: [0, 0, 2.5], fov: 45 }}>
          <color attach="background" args={['#040608']} />
          <Suspense fallback={null}>
            <CosmicBackground />
            <Earth />
            <CameraManager />
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={1.2}
              maxDistance={5}
              rotateSpeed={0.5}
              zoomSpeed={0.5}
              autoRotate={shouldAutoRotate}
              autoRotateSpeed={0.2}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">


        <header className="flex justify-between items-start pointer-events-auto">
          {/* Header Text Group */}
          <div>
            <style>{`
              @keyframes gradient-x {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .animate-gradient-x {
                animation: gradient-x 3s ease infinite;
                background-size: 200% auto;
              }
            `}</style>
            <h1 className="text-xl md:text-3xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-green-400 animate-gradient-x drop-shadow-[0_0_10px_rgba(0,255,255,0.3)] font-mono leading-tight">
              {t[language].title}
            </h1>
            <div className="text-[10px] md:text-xs text-white/50 tracking-widest font-mono mt-1 flex items-center gap-2 pl-1">
              {dateStr} <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" /> <span className="text-green-400 font-bold">{t[language].live}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <LanguageToggle />
          </div>
        </header>

        {/* Hovered Country Name (Center Screen or Dynamic) */}
        <CountryTooltip />
        <StationList />

        <footer className="pointer-events-auto">
          <PlayerPanel />
        </footer>


      </div>
    </div>
  );
}

export default App;
