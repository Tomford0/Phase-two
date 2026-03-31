"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '@/context/AuthContext';

delete (L.Icon.Default.prototype as any)._getIconUrl;

type VehicleType = 'AMBULANCE' | 'FIRE_TRUCK' | 'POLICE_CAR';

interface VehicleLocation {
  id: string;
  name: string;
  position: [number, number];
  status: string;
  type: VehicleType | string;
}

interface HospitalLocation {
  id: string;
  name: string;
  position: [number, number];
  bedAvailable: number;
  ambulanceCount: number;
}

const VEHICLE_CONFIG: Record<string, { color: string; bg: string; label: string; symbol: string }> = {
  AMBULANCE:  { color: '#fff', bg: '#e53935', label: 'Ambulance',  symbol: '🚑' },
  FIRE_TRUCK: { color: '#fff', bg: '#e65100', label: 'Fire Truck', symbol: '🚒' },
  POLICE_CAR: { color: '#fff', bg: '#1565c0', label: 'Police',     symbol: '🚓' },
  DEFAULT:    { color: '#fff', bg: '#37474f', label: 'Vehicle',    symbol: '🚗' },
};

function isValidCoord(lat: number, lng: number) {
  return (
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

function createVehicleIcon(type: string, status: string) {
  const cfg = VEHICLE_CONFIG[type] ?? VEHICLE_CONFIG.DEFAULT;
  const opacity = status === 'OFFLINE' ? '0.5' : '1';
  const html = `
    <div style="
      background:${cfg.bg};
      opacity:${opacity};
      color:${cfg.color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.8);
    ">
      <span style="transform:rotate(45deg);font-size:16px;line-height:1;">${cfg.symbol}</span>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38] });
}

function createHospitalIcon() {
  const html = `
    <div style="
      background:#00897b;
      color:#fff;
      border-radius:8px;
      width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
      border:2px solid rgba(255,255,255,0.8);
      font-size:18px;
    ">🏥</div>
  `;
  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -38] });
}

/** Automatically pans/zooms the map to fit all vehicle markers whenever they change. */
function FitToBounds({ markers }: { markers: VehicleLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].position, 14);
    } else {
      const bounds = L.latLngBounds(markers.map(m => m.position));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [markers, map]);
  return null;
}

/** Recenter button — flies back to fit all vehicles in view. */
function RecenterButton({ markers, defaultPosition }: { markers: VehicleLocation[]; defaultPosition: [number, number] }) {
  const map = useMap();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        if (markers.length === 1) {
          map.setView(markers[0].position, 14);
        } else if (markers.length > 1) {
          map.fitBounds(L.latLngBounds(markers.map(m => m.position)), { padding: [60, 60] });
        } else {
          map.setView(defaultPosition, 13);
        }
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
  const [hospitals, setHospitals] = useState<HospitalLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [invalidCount, setInvalidCount] = useState(0);

  // Accra, Ghana — used only as initial map center
  const defaultPosition: [number, number] = [5.6037, -0.1870];

  useEffect(() => {
    let isMounted = true;

    async function fetchCoordinates() {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const [vehiclesReq, hospitalsReq] = await Promise.all([
          fetch('/api/vehicles', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/hospitals', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (!vehiclesReq.ok) {
          throw new Error('Failed to fetch vehicles from backend');
        }

        // Fetch hospitals (non-fatal)
        if (hospitalsReq.ok) {
          const hospitalData = await hospitalsReq.json();
          const validHospitals: HospitalLocation[] = hospitalData
            .filter((h: any) => isValidCoord(Number(h.latitude), Number(h.longitude)))
            .map((h: any) => ({
              id: h.id,
              name: h.name,
              position: [Number(h.latitude), Number(h.longitude)] as [number, number],
              bedAvailable: h.bedAvailable,
              ambulanceCount: h.ambulanceCount,
            }));
          if (isMounted) setHospitals(validHospitals);
        }

        const vehicles = await vehiclesReq.json();
        const activeUnits: VehicleLocation[] = [];
        let badCoords = 0;

        for (const vehicle of vehicles) {
          // Primary: latest tracking-service GPS ping
          let lat: number | undefined;
          let lng: number | undefined;

          try {
            const locReq = await fetch(`/api/tracking/vehicles/${vehicle.id}/location`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (locReq.ok) {
              const locData = await locReq.json();
              lat = locData.latitude ?? locData.lat;
              lng = locData.longitude ?? locData.lng;
            }
          } catch {
            // tracking service unavailable — fall through to vehicle record
          }

          // Fallback: coordinates stored on the vehicle record itself
          if (lat === undefined || lng === undefined) {
            lat = vehicle.currentLat;
            lng = vehicle.currentLon;
          }

          const latN = Number(lat);
          const lngN = Number(lng);

          if (!isValidCoord(latN, lngN)) {
            badCoords++;
            console.warn(`Vehicle ${vehicle.plateNumber} has invalid coordinates: lat=${lat}, lon=${lng}`);
            continue;
          }

          activeUnits.push({
            id: vehicle.id,
            name: vehicle.plateNumber || `Unit ${vehicle.id}`,
            position: [latN, lngN],
            status: vehicle.status || 'AVAILABLE',
            type: vehicle.type || 'DEFAULT'
          });
        }

        if (isMounted) {
          setMarkers(activeUnits);
          setInvalidCount(badCoords);
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Error communicating with backend.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCoordinates();
    const interval = setInterval(fetchCoordinates, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* Error banner */}
      {errorMsg && (
        <div style={{ position: 'absolute', zIndex: 1000, top: 10, left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ position: 'absolute', zIndex: 1000, bottom: 70, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', border: '1px solid #ccc', color: '#555', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          Connecting to live GPS feed…
        </div>
      )}

      {/* Invalid coordinate warning */}
      {!loading && invalidCount > 0 && (
        <div style={{ position: 'absolute', zIndex: 1000, top: 10, left: '50%', transform: 'translateX(-50%)', background: '#fff3cd', border: '1px solid #ffc107', color: '#856404', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
          ⚠ {invalidCount} vehicle{invalidCount > 1 ? 's have' : ' has'} invalid GPS coordinates — go to Vehicle Management to fix them.
        </div>
      )}

      {/* No valid vehicles */}
      {!loading && markers.length === 0 && !errorMsg && invalidCount === 0 && (
        <div style={{ position: 'absolute', zIndex: 1000, bottom: 70, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', border: '1px solid #ccc', color: '#555', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          No active vehicles with GPS signals found.
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        background: 'rgba(255,255,255,0.95)', border: '1px solid #ddd',
        borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', lineHeight: '1.8'
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: '#333' }}>Vehicle Types</div>
        {Object.entries(VEHICLE_CONFIG).filter(([k]) => k !== 'DEFAULT').map(([, cfg]) => (
          <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, background: cfg.bg, borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ color: '#333' }}>{cfg.symbol} {cfg.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, borderTop: '1px solid #eee', paddingTop: 6 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: VEHICLE_CONFIG.DEFAULT.bg, borderRadius: '50%', flexShrink: 0, opacity: 0.5 }} />
          <span style={{ color: '#888', fontStyle: 'italic' }}>Offline / faded</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#00897b', borderRadius: '3px', flexShrink: 0 }} />
          <span style={{ color: '#333' }}>🏥 Hospital</span>
        </div>
      </div>

      <MapContainer center={defaultPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Auto-pan to vehicles whenever markers load/update */}
        <FitToBounds markers={markers} />

        {/* Recenter button — fits all vehicles in view */}
        <RecenterButton markers={markers} defaultPosition={defaultPosition} />

        {markers.map(unit => {
          const cfg = VEHICLE_CONFIG[unit.type] ?? VEHICLE_CONFIG.DEFAULT;
          return (
            <Marker key={unit.id} position={unit.position} icon={createVehicleIcon(unit.type, unit.status)}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }}>{cfg.symbol}</span>
                    <strong style={{ color: cfg.bg }}>{cfg.label}</strong>
                  </div>
                  <div><strong>Unit:</strong> {unit.name}</div>
                  <div><strong>Status:</strong> {unit.status}</div>
                  <div><strong>Lat:</strong> {unit.position[0].toFixed(5)}</div>
                  <div><strong>Lng:</strong> {unit.position[1].toFixed(5)}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 4 }}>Live GPS Signal</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {hospitals.map(h => (
          <Marker key={h.id} position={h.position} icon={createHospitalIcon()}>
            <Popup>
              <div style={{ minWidth: 150 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>🏥</span>
                  <strong style={{ color: '#00897b' }}>Hospital</strong>
                </div>
                <div><strong>Name:</strong> {h.name}</div>
                <div><strong>Beds Available:</strong> {h.bedAvailable}</div>
                <div><strong>Ambulances:</strong> {h.ambulanceCount}</div>
                <div><strong>Lat:</strong> {h.position[0].toFixed(5)}</div>
                <div><strong>Lng:</strong> {h.position[1].toFixed(5)}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
