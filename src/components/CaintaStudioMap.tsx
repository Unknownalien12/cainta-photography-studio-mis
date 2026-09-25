import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Studio } from '../db/types.js';
import { setupLeafletIcons, CAINTA_COORDINATES, CAINTA_LANDMARKS, calculateHaversineDistance } from '../utils/leafletConfig.js';
import { MapPin, Navigation, Compass, Star } from 'lucide-react';

interface CaintaStudioMapProps {
  studios: Studio[];
  onSelectStudio?: (studio: Studio) => void;
  onBookStudio?: (studio: Studio) => void;
  selectedStudioId?: string;
  height?: string;
}

export const CaintaStudioMap: React.FC<CaintaStudioMapProps> = ({
  studios,
  onSelectStudio,
  onBookStudio,
  selectedStudioId,
  height = '520px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeStudio, setActiveStudio] = useState<Studio | null>(null);

  useEffect(() => {
    setupLeafletIcons();

    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CAINTA_COORDINATES,
      zoom: 13,
      zoomControl: true
    });

    // High clarity Street Map tiles (CartoDB Positron / OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Studio Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    studios.forEach(studio => {
      if (!studio.latitude || !studio.longitude) return;

      const isSelected = studio.id === selectedStudioId;

      // Custom Amber pin icon
      const customIcon = L.divIcon({
        className: 'custom-studio-pin',
        html: `
          <div style="
            background: ${isSelected ? '#b45309' : '#d97706'};
            color: #ffffff;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <div style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">
              📸
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      const marker = L.marker([studio.latitude, studio.longitude], { icon: customIcon });

      marker.on('click', () => {
        setActiveStudio(studio);
        if (onSelectStudio) onSelectStudio(studio);
      });

      marker.addTo(map);
      markersRef.current.set(studio.id, marker);
    });

    // Auto-center if selectedStudioId provided
    if (selectedStudioId) {
      const target = studios.find(s => s.id === selectedStudioId);
      if (target && target.latitude && target.longitude) {
        map.setView([target.latitude, target.longitude], 15, { animate: true });
        setActiveStudio(target);
      }
    }
  }, [studios, selectedStudioId, onSelectStudio]);

  // Handle Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGeoError(null);

        const map = mapInstanceRef.current;
        if (!map) return;

        if (userMarkerRef.current) userMarkerRef.current.remove();

        const userIcon = L.divIcon({
          className: 'user-pulse-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background: #2563eb;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.25);
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker(coords, { icon: userIcon }).addTo(map);
        marker.bindPopup('<b>You are here</b><br>Calculating distances to Cainta studios...').openPopup();
        userMarkerRef.current = marker;

        map.setView(coords, 14, { animate: true });
      },
      err => {
        setGeoError('Could not acquire location permission.');
      }
    );
  };

  const jumpToLandmark = (coords: [number, number]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(coords, 15, { animate: true });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-stone-200 bg-white">
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* Top Cainta Corridor Shortcuts */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-stone-200">
        <span className="text-[11px] font-semibold text-stone-500 px-2 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-amber-600" /> Cainta Landmarks:
        </span>
        {CAINTA_LANDMARKS.map(lm => (
          <button
            key={lm.name}
            onClick={() => jumpToLandmark(lm.coords)}
            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-800 text-stone-700 transition-colors"
          >
            {lm.name}
          </button>
        ))}
      </div>

      {/* Locate Me Floating Action Button */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          id="btn-map-locate-me"
          onClick={handleLocateMe}
          title="Detect My Location"
          className="flex items-center gap-1.5 px-3 py-2 bg-white text-stone-800 rounded-xl shadow-lg border border-stone-200 hover:bg-stone-50 font-medium text-xs transition-transform active:scale-95"
        >
          <Navigation className="w-4 h-4 text-blue-600" />
          <span>My Location</span>
        </button>
      </div>

      {/* Active Studio Card Popup on map bottom */}
      {activeStudio && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-[1000] bg-white p-3.5 rounded-2xl shadow-2xl border border-stone-200 animate-slideUp">
          <div className="flex items-start gap-3">
            <img
              src={activeStudio.logo}
              alt={activeStudio.name}
              className="w-14 h-14 rounded-xl object-cover border border-stone-100 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-stone-900 text-sm truncate">{activeStudio.name}</h4>
                <button
                  onClick={() => setActiveStudio(null)}
                  className="text-stone-400 hover:text-stone-600 text-xs px-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                <span className="flex items-center text-amber-600 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                  {activeStudio.rating} ({activeStudio.reviewCount})
                </span>
                <span>•</span>
                <span className="truncate">{activeStudio.location}</span>
              </div>

              {userLocation && (
                <div className="mt-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                  📍 {calculateHaversineDistance(userLocation[0], userLocation[1], activeStudio.latitude, activeStudio.longitude)} km from you
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-stone-100">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-medium block">Starting at</span>
                  <span className="text-xs font-bold text-amber-600">₱{activeStudio.startingPrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (onSelectStudio) onSelectStudio(activeStudio);
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 font-medium"
                  >
                    View Studio
                  </button>
                  <button
                    id="btn-map-popup-book"
                    onClick={() => {
                      if (onBookStudio) onBookStudio(activeStudio);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-sm"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
