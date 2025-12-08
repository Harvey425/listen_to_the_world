
import { useMemo, useEffect, useRef } from 'react';
import styles from './WeatherOverlay.module.css';
import { WeatherSystem } from './WeatherEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface WeatherOverlayProps {
    weatherCode: number;
    timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
}

export function WeatherOverlay({ weatherCode, timeOfDay = 'day' }: WeatherOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const systemRef = useRef<WeatherSystem>(new WeatherSystem());

    // Determine Base Gradient (Reuse CSS module)
    // Determine Base Gradient (Reuse CSS module)
    const bgClass = useMemo(() => {
        // 1. For Precipitation/Overcast, we use the WEATHER gradient as base, 
        // and let the TimeFilterLayer tint it dark/colored.
        if (weatherCode === 3) return styles.overcast;
        if (weatherCode === 45 || weatherCode === 48) return styles.foggy;
        if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99)) return styles.rainy;
        if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) return styles.snowy;

        // 2. For Clear/Partly Cloudy, we use the TIME gradient directly (swapping the sky entirely)
        if (timeOfDay === 'dawn') return styles.dawn;
        if (timeOfDay === 'dusk') return styles.dusk;
        if (timeOfDay === 'night') return styles.night;

        // 3. Default Day
        return styles.clearDay;
    }, [weatherCode, timeOfDay]);

    // Time Lighting Filter (For darkening rain/snow at night)
    const timeFilterStyle = useMemo(() => {
        // If we are using a Time Gradient (Clear Sky), we don't need much filter
        const isThemeWeather = (weatherCode <= 2);
        if (isThemeWeather) return {};

        // For Rain/Snow/Fog, apply tint
        if (timeOfDay === 'night') return { backgroundColor: 'rgba(0, 10, 30, 0.7)', mixBlendMode: 'multiply' as const };
        if (timeOfDay === 'dusk') return { backgroundColor: 'rgba(100, 50, 20, 0.1)', mixBlendMode: 'overlay' as const }; // Subtle warm overlay, let gradient do the work
        if (timeOfDay === 'dawn') return { backgroundColor: 'rgba(255, 150, 150, 0.2)', mixBlendMode: 'overlay' as const };

        return {};
    }, [timeOfDay, weatherCode]);

    // Canvas & Engine Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Determine System Type
        let type: 'rain' | 'snow' | 'clear' | 'showers' | 'cloudy' = 'clear';
        // Rain
        let rainIntensity = 1;
        if ((weatherCode >= 61 && weatherCode <= 65) || (weatherCode >= 95)) type = 'rain'; // Heavy rain
        if (weatherCode === 63 || weatherCode === 81) rainIntensity = 2; // Moderate
        if (weatherCode === 65 || weatherCode === 82 || weatherCode >= 95) rainIntensity = 3; // Heavy

        // Showers
        if ((weatherCode >= 51 && weatherCode <= 55) || (weatherCode >= 80 && weatherCode <= 82)) type = 'showers'; // Variable
        // Snow
        if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) type = 'snow';
        // Cloudy (New)
        if ([2, 3, 45, 48].includes(weatherCode)) type = 'cloudy';

        // Init Engine
        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
                systemRef.current.init(canvas.width, canvas.height, type, rainIntensity);
            }
        };

        resize();
        window.addEventListener('resize', resize);

        // Animation Loop
        let animationId: number;
        const render = () => {
            systemRef.current.update(16); // ~60fps
            systemRef.current.draw(ctx);
            animationId = requestAnimationFrame(render);
        };
        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [weatherCode]); // Restart engine on code change

    // Visual Elements Helper
    // Visual Elements Helper
    const isSunny = (weatherCode <= 1) && timeOfDay === 'day';
    const isClearNight = (weatherCode <= 2) && timeOfDay === 'night'; // Allow stars on partly cloudy too? 0,1,2
    const isPartlyCloudy = weatherCode === 2;
    const isOvercast = weatherCode === 3;
    const isFoggy = weatherCode === 45 || weatherCode === 48;
    const isRaining = (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 99);
    const isSnowing = (weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86);

    return (
        <div className={styles.container}>
            {/* 1. Dynamic CSS Gradient + CSS Overlay Layers (Sun/Clouds/Fog) */}
            <div className={`${styles.gradientLayer} ${styles.active} ${bgClass}`} />

            {/* 1.5. Time Filter Layer (Tinting for Rain/Snow at night) */}
            <div
                className={styles.gradientLayer} // Reuse transition props
                style={{
                    zIndex: 2,
                    opacity: 1,
                    pointerEvents: 'none',
                    ...timeFilterStyle
                }}
            />

            {/* Sun Effects (CSS) - Good for soft glow */}
            {isSunny && (
                <>
                    <div className={styles.sunBeams} />
                    <div className={styles.sunDisk} />
                    <div className={styles.sunGlow} />
                </>
            )}

            {/* Night Effects (Stars Only) - Smooth Fade */}
            <AnimatePresence>
                {isClearNight && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 z-[2]" /* Container for stars */
                    >
                        {/* Moon Removed Request */}
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className={styles.star}
                                style={{
                                    top: `${Math.random() * 60}%`,
                                    left: `${Math.random() * 100}%`,
                                    width: `${Math.random() * 3 + 1}px`, // 1-4px
                                    height: `${Math.random() * 3 + 1}px`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cloud/Fog Effects (CSS) - Mist is better in CSS */}
            {isPartlyCloudy && <div className={styles.cloudLayer} />}
            {isOvercast && <><div className={styles.cloudLayer} /><div className={styles.thickClouds} /></>}
            {isFoggy && <div className={styles.fogLayer} />}

            {/* 2. Canvas Particle Layer (Rain/Snow/Lightning) */}
            <canvas
                ref={canvasRef}
                className={styles.canvasLayer}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 5
                }}
            />

            {/* 3. Readability Overlay */}
            <div
                className={styles.contrastOverlay}
                style={{
                    backgroundColor: `rgba(0, 0, 0, ${isOvercast ? 0.4 :
                        isPartlyCloudy ? 0.1 : // Much lighter overlay for cloudy to see the blue
                            isRaining ? 0.3 :
                                isSnowing ? 0.2 :
                                    isSunny ? 0.1 : 0.2
                        })`
                }}
            />
        </div>
    );
}
