"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '@/context/AuthContext';

// Fix for default marker icons in Next.js/Leaflet context
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface VehicleLocation {
  id: string;
  name: string;
  position: [number, number];
  status: string;
}

function RecenterButton({ position }: { position: [number, number] }) {
  const map = useMap();
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        map.setView(position, 13);
      }}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-text)',
        border: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem'
      }}
    >
      Recenter View
    </button>
  );
}

export default function MapComponent() {
  const { user } = useAuth();
  const [markers, setMarkers] = useState<VehicleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Default coordinate (New York) to center map if no data exists
  const defaultPosition: [number, number] = [40.7128, -74.0060];

  useEffect(() => {
    let isMounted = true;

    async function fetchCoordinates() {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        // 1. Fetch all registered vehicles from Dispatch Service
        const vehiclesReq = await fetch('http://localhost:3000/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!vehiclesReq.ok) {
          throw new Error('Failed to fetch vehicles from backend');
        }
        
        const vehicles = await vehiclesReq.json();
        const activeUnits: VehicleLocation[] = [];

        // 2. Fetch specific GPS locations for each vehicle
        for (const vehicle of vehicles) {
          try {
            const locReq = await fetch(`http://localhost:3000/tracking/vehicles/${vehicle.id}/location`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (locReq.ok) {
              const locData = await locReq.json();
              const lat = locData.latitude || locData.lat || (locData.coordinates && locData.coordinates[0]);
              const lng = locData.longitude || locData.lng || (locData.coordinates && locData.coordinates[1]);

              if (lat !== undefined && lng !== undefined) {
                activeUnits.push({
                  id: vehicle.id,
                  name: vehicle.plateNumber || vehicle.name || `Unit ${vehicle.id}`,
                  position: [parseFloat(lat), parseFloat(lng)],
                  status: vehicle.status || 'ACTIVE'
                });
              }
            }
          } catch (e) {
            console.warn(`Could not fetch location for vehicle ${vehicle.id}`, e);
          }
        }

        if (isMounted) setMarkers(activeUnits);
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Error communicating with Tracking Servce.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCoordinates();
    
    // Auto-refresh GPS points every 10 seconds
    const interval = setInterval(fetchCoordinates, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const centerPosition = markers.length > 0 ? markers[0].position : defaultPosition;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {errorMsg && markers.length === 0 && (
         <div style={{ position: 'absolute', zIndex: 1000, top: 10, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 }}>
           {errorMsg}
         </div>
      )}
      
      <MapContainer center={centerPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <RecenterButton position={centerPosition} />
        
        {loading && markers.length === 0 && (
          <Marker position={defaultPosition}>
            <Popup>Connecting to API Gateway (:3000) for live signals...</Popup>
          </Marker>
        )}

        {!loading && markers.length === 0 && (
           <Marker position={defaultPosition}>
             <Popup>No active GPS signals found in database. Showing origin point.</Popup>
           </Marker>
        )}
        
        {markers.map(unit => (
          <Marker key={unit.id} position={unit.position}>
            <Popup>
              <strong>{unit.name}</strong><br/>
              Status: {unit.status}<br/>
              <em>Live GPS Signal</em>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
