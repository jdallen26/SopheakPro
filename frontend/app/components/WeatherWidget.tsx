'use client';

import React, { useState, useEffect } from 'react';

interface ForecastPeriod {
    name: string;
    temperature: number;
    shortForecast: string;
    icon: string;
}

const WeatherWidget: React.FC = () => {
    const [currentForecast, setCurrentForecast] = useState<ForecastPeriod | null>(null);
    const [dailyForecasts, setDailyForecasts] = useState<ForecastPeriod[]>([]);
    const [radarUrl, setRadarUrl] = useState<string>('');
    const [locationName, setLocationName] = useState<string>('');
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const formatTimestamp = () => new Date().toLocaleTimeString();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch forecast and location
                const pointsResponse = await fetch('https://api.weather.gov/points/44.95,-93.09');
                if (!pointsResponse.ok) throw new Error('Failed to fetch grid points');
                const pointsData = await pointsResponse.json();
                const forecastUrl = pointsData.properties.forecast;
                const location = pointsData.properties.relativeLocation.properties;
                setLocationName(`${location.city}, ${location.state}`);

                const forecastResponse = await fetch(forecastUrl);
                if (!forecastResponse.ok) throw new Error('Failed to fetch forecast');
                const forecastData = await forecastResponse.json();
                
                const periods: ForecastPeriod[] = forecastData.properties.periods;
                setCurrentForecast(periods[0]);
                setDailyForecasts(periods.slice(0, 14)); // Get all 14 periods
                
                // Update radar URL
                const baseUrl = 'https://radar.weather.gov/ridge/standard/KMPX_loop.gif';
                setRadarUrl(`${baseUrl}?_=${new Date().getTime()}`);

                setLastUpdated(formatTimestamp());
                setError(null);
            } catch (e) {
                setError('Could not load weather data.');
                console.error(e);
            }
        };

        fetchAllData();
        const interval = setInterval(fetchAllData, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const interactiveRadarUrl = "https://radar.weather.gov/?settings=v1_eyJhZ2VuZGEiOnsiaWQiOiJsb2NhbCIsImNlbnRlciI6[-93.09,44.95],\"zoom\":8},\"YW5pbWF0aW5nIjp0cnVlLCJiYXNlIjoic3RhbmRhcmQiLCJjb3VudHkiOmZhbHNlLCJjd2EiOmZhbHNlLCJyZmMiOmZhbHNlLCJzdGF0ZSI6ZmFsc2UsImxvY2FsIjpmYWxzZSwibG9jYWxTdGF0aW9ucyI6ZmFsc2UsIm1hc3QiOmZhbHNlfQ%3D%3D#/";

    return (
        <div className="panel w-full">
            <div className="panel-heading flex justify-between items-center">
                <span>Live Weather: <span className="font-normal">{locationName}</span></span>
                <span className="text-xs font-normal">
                    Last Updated: {lastUpdated}
                </span>
            </div>
            <div className="panel-body flex gap-4">
                {/* Left Column: Forecast Data */}
                <div className="w-3/4 flex flex-col justify-between">
                    {/* Row 1: Current Weather */}
                    <div>
                        {error && <p className="text-red-500">{error}</p>}
                        {currentForecast ? (
                            <div className="flex items-center gap-2 mb-4">
                                <img src={currentForecast.icon} alt={currentForecast.shortForecast} className="w-10 h-10" />
                                <div>
                                    <p className="text-2xl font-bold">{currentForecast.temperature}°F</p>
                                    <p className="text-xs text-[var(--foreground-muted)]">{currentForecast.shortForecast}</p>
                                </div>
                            </div>
                        ) : (
                            !error && <p>Loading forecast...</p>
                        )}
                    </div>

                    {/* Row 2: 14-Day Forecast */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {dailyForecasts.slice(0, 7).map((day, index) => (
                                <div key={index} className="flex flex-col items-center p-1 rounded-md bg-[var(--background-secondary)]"
                                    style={{marginBottom: '4px'}}
                                >
                                    <p className="font-semibold text-xs">{day.name}</p>
                                    <img src={day.icon} alt={day.shortForecast} className="w-10 h-10" />
                                    <p className="text-md font-bold">{day.temperature}°F</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                            {dailyForecasts.slice(7, 14).map((day, index) => (
                                <div key={index} className="flex flex-col items-center p-1 rounded-md bg-[var(--background-secondary)]">
                                    <p className="font-semibold text-xs">{day.name}</p>
                                    <img src={day.icon} alt={day.shortForecast} className="w-10 h-10" />
                                    <p className="text-md font-bold">{day.temperature}°F</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Radar */}
                <div className="w-1/4">
                    <a href={interactiveRadarUrl} target="_blank" rel="noopener noreferrer" title="View Interactive Radar">
                        {radarUrl ? (
                            <img src={radarUrl} alt="Weather Radar Loop" className="w-full h-auto rounded-md border border-[var(--border-color)]" />
                        ) : (
                            <p>Loading radar...</p>
                        )}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default WeatherWidget;
