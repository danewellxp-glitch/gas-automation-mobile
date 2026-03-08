import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';

/** 
 * MapUpdater component to smoothly pan the map as the user moves 
 */
function MapUpdater({ center }: { center?: LatLngExpression | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);
    return null;
}

/**
 * Driver custom icon (Uber-style)
 */
const driverIcon = new L.DivIcon({
    className: 'custom-driver-icon',
    html: `
    <div style="
      width: 44px; height: 44px; 
      background: rgba(16, 185, 129, 0.2); 
      border-radius: 50%; 
      display: flex; align-items: center; justify-content: center;
      position: relative;
    ">
      <div style="
        width: 16px; height: 16px; 
        background: #10B981; 
        border-radius: 50%; 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
});

interface InteractiveMapProps {
    currentPosition?: { latitude: number; longitude: number } | null;
    children?: React.ReactNode;
}

export function InteractiveMap({ currentPosition, children }: InteractiveMapProps) {
    // Default to a central point if no position is available (e.g. Curitiba/PR)
    const defaultPos: LatLngExpression = [-25.4284, -49.2733];
    const centerPos: LatLngExpression = currentPosition
        ? [currentPosition.latitude, currentPosition.longitude]
        : defaultPos;

    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {/* 
        We use zoomControl={false} for a cleaner look.
        Leaflet needs absolute sizing. 
      */}
            <MapContainer
                center={centerPos}
                zoom={16}
                zoomControl={false}
                style={{ width: '100%', height: '100%' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapUpdater center={currentPosition ? centerPos : null} />

                {currentPosition && (
                    <Marker position={centerPos} icon={driverIcon} />
                )}

                {/* Child overlays (e.g., active delivery routes or other markers) can be rendered here inside the MapContainer context */}
                {children}
            </MapContainer>
        </div>
    );
}
