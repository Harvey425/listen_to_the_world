import { useEffect, useState } from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { getCountryName } from '../../utils/localization';

export function CountryTooltip() {
    const { hoveredCountry, hoveredCountryCode, activeStation, language } = useRadioStore();
    const [toastData, setToastData] = useState<{ line1: string, line2: string } | null>(null);

    // Show dual-line toast when activeStation changes
    useEffect(() => {
        if (activeStation) {
            setToastData({
                line1: getCountryName(activeStation.countrycode, activeStation.country || 'Unknown', language),
                line2: activeStation.name
            });
            const timer = setTimeout(() => setToastData(null), 4000); // Show for 4 seconds
            return () => clearTimeout(timer);
        }
    }, [activeStation, language]);

    // Priority: Toast (Dual Line) > Hover (Single Line)

    if (toastData) {
        return (
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 pointer-events-none text-center z-30 w-full px-10">
                <h2 className="text-4xl md:text-5xl font-thin text-white tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-fade-in mb-2">
                    {toastData.line1}
                </h2>
                <div className="text-xl md:text-2xl font-light text-primary tracking-widest uppercase drop-shadow-md animate-fade-in-up">
                    {toastData.line2}
                </div>
            </div>
        );
    }

    if (hoveredCountryCode || hoveredCountry) {
        return (
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 pointer-events-none text-center z-30 w-full px-10">
                <h2 className="text-4xl md:text-6xl font-thin text-white tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-fade-in">
                    {getCountryName(hoveredCountryCode!, hoveredCountry!, language)}
                </h2>
            </div>
        );
    }

    return null;
}
