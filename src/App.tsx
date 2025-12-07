import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import { Earth } from './components/Globe/Earth';
import { PlayerPanel } from './components/UI/PlayerPanel';
import { CameraManager } from './components/CameraManager';
import { CaptionOverlay } from './components/UI/CaptionOverlay';
import { StationList } from './components/UI/StationList';
import { LanguageToggle } from './components/UI/LanguageToggle';
import { CountryTooltip } from './components/UI/CountryTooltip';
import { useRadioStore } from './store/useRadioStore';

function App() {
  const { activeStation, selectedCountry } = useRadioStore();

  // Disable auto-rotate when interacting
  const shouldAutoRotate = !activeStation && !selectedCountry;

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas gl={{ antialias: true }} camera={{ position: [0, 0, 2.5], fov: 45 }}>
          <color attach="background" args={['#040608']} />
          <Suspense fallback={null}>
            <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
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
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <header className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-2xl font-light tracking-[0.2em] text-white backdrop-blur-sm drop-shadow-lg">
              LISTEN TO THE WORLD
            </h1>
            <div className="text-xs text-white/50 tracking-widest font-mono backdrop-blur-sm mt-1">
              {new Date().toLocaleTimeString()} • LIVE
            </div>
          </div>

          <div className="flex gap-4">
            <LanguageToggle />
          </div>
        </header>

        {/* Hovered Country Name (Center Screen or Dynamic) */}
        <CountryTooltip />

        <CaptionOverlay />
        <StationList />

        <footer className="pointer-events-auto">
          <PlayerPanel />
        </footer>
      </div>

    </div>
  );
}

export default App;
