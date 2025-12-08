interface WeatherResponse {
    current_weather: {
        temperature: number;
        windspeed: number;
        weathercode: number;
    }
    utc_offset_seconds: number;
}

export interface WeatherData {
    temperature: number;
    windspeed: number;
    weathercode: number;
    description: string;
    icon: string;
    utcOffsetSeconds: number; // For live clock
}

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
const weatherCodeMap: Record<number, { icon: string; label: { en: string; zh: string } }> = {
    0: { icon: '☀️', label: { en: 'Clear sky', zh: '晴朗' } },
    1: { icon: '🌤️', label: { en: 'Mainly clear', zh: '大部晴朗' } },
    2: { icon: '⛅', label: { en: 'Partly cloudy', zh: '多云' } },
    3: { icon: '☁️', label: { en: 'Overcast', zh: '阴天' } },
    45: { icon: '🌫️', label: { en: 'Fog', zh: '雾' } },
    48: { icon: '🌫️', label: { en: 'Depositing rime fog', zh: '凇雾' } },
    51: { icon: '🌦️', label: { en: 'Light drizzle', zh: '毛毛雨' } },
    53: { icon: '🌦️', label: { en: 'Moderate drizzle', zh: '小雨' } },
    55: { icon: '🌧️', label: { en: 'Dense drizzle', zh: '细雨' } },
    61: { icon: '🌧️', label: { en: 'Slight rain', zh: '小雨' } },
    63: { icon: '🌧️', label: { en: 'Moderate rain', zh: '中雨' } },
    65: { icon: '🌧️', label: { en: 'Heavy rain', zh: '大雨' } },
    71: { icon: '❄️', label: { en: 'Slight snow', zh: '小雪' } },
    73: { icon: '❄️', label: { en: 'Moderate snow', zh: '中雪' } },
    75: { icon: '❄️', label: { en: 'Heavy snow', zh: '大雪' } },
    77: { icon: '❄️', label: { en: 'Snow grains', zh: '雪粒' } },
    80: { icon: '🌦️', label: { en: 'Slight rain showers', zh: '阵雨' } },
    81: { icon: '🌧️', label: { en: 'Moderate rain showers', zh: '中阵雨' } },
    82: { icon: '⛈️', label: { en: 'Violent rain showers', zh: '暴雨' } },
    85: { icon: '❄️', label: { en: 'Slight snow showers', zh: '阵雪' } },
    86: { icon: '❄️', label: { en: 'Heavy snow showers', zh: '大阵雪' } },
    95: { icon: '⛈️', label: { en: 'Thunderstorm', zh: '雷雨' } },
    96: { icon: '⛈️', label: { en: 'Thunderstorm with hail', zh: '雷雨夹冰雹' } },
    99: { icon: '⛈️', label: { en: 'Thunderstorm with heavy hail', zh: '大雷雨夹冰雹' } }
};

export async function fetchWeather(lat: number, lon: number, lang: 'en' | 'zh' = 'en'): Promise<WeatherData | null> {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        );

        if (!response.ok) {
            throw new Error('Weather API failed');
        }

        const data: WeatherResponse = await response.json();
        const { current_weather, utc_offset_seconds } = data;

        // Default fallback if code not found
        const codeInfo = weatherCodeMap[current_weather.weathercode] || { icon: '🌡️', label: { en: 'Unknown', zh: '未知' } };

        return {
            temperature: current_weather.temperature,
            windspeed: current_weather.windspeed,
            weathercode: current_weather.weathercode,
            description: codeInfo.label[lang], // Return localized label directly
            icon: codeInfo.icon,
            utcOffsetSeconds: utc_offset_seconds
        };
    } catch (e) {
        console.warn("Failed to fetch weather", e);
        return null; // Graceful failure
    }
}
