"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import styles from '../incidents/page.module.css';

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  status: string;
  currentLat: number;
  currentLon: number;
}

const VALID_STATUSES = ['AVAILABLE', 'BUSY', 'OFFLINE'];

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Create form
  const [formPlate, setFormPlate] = useState('');
  const [formType, setFormType] = useState('AMBULANCE');
  const [formLat, setFormLat] = useState('');
  const [formLon, setFormLon] = useState('');

  // Status form
  const [formStatus, setFormStatus] = useState('AVAILABLE');

  // Edit location form
  const [formEditLat, setFormEditLat] = useState('');
  const [formEditLon, setFormEditLon] = useState('');

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/vehicles', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      setVehicles(await res.json());
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(formLat);
    const lon = parseFloat(formLon);
    if (isNaN(lat) || lat < -90 || lat > 90) { alert('Latitude must be between −90 and 90'); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { alert('Longitude must be between −180 and 180'); return; }
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ plateNumber: formPlate, type: formType, currentLat: lat, currentLon: lon })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowCreateModal(false);
      setFormPlate(''); setFormType('AMBULANCE'); setFormLat(''); setFormLon('');
      fetchVehicles();
    } catch (err: any) { alert(err.message); }
  }

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    const lat = parseFloat(formEditLat);
    const lon = parseFloat(formEditLon);
    if (isNaN(lat) || lat < -90 || lat > 90) { alert('Latitude must be between −90 and 90'); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { alert('Longitude must be between −180 and 180'); return; }
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle.id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ currentLat: lat, currentLon: lon })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowLocationModal(false);
      fetchVehicles();
    } catch (err: any) { alert(err.message); }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVehicle) return;
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: formStatus })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowStatusModal(false);
      fetchVehicles();
    } catch (err: any) { alert(err.message); }
  }

  if (!user || !['ADMIN', 'DISPATCHER', 'AMBULANCE'].includes(user.role)) return <div>Unauthorized access.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Vehicle Management</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>Register Vehicle</button>
      </div>
      {errorMsg && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 500 }}>{errorMsg}</p>}
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Plate Number</th><th>Type</th><th>Status</th><th>Coordinates</th><th>Actions</th></tr></thead>
            <tbody>
              {vehicles.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No vehicles registered.</td></tr>}
              {vehicles.map(v => {
                const validCoords = isFinite(v.currentLat) && isFinite(v.currentLon) && v.currentLat >= -90 && v.currentLat <= 90 && v.currentLon >= -180 && v.currentLon <= 180;
                return (
                  <tr key={v.id}>
                    <td className={styles.mono}>{v.id.slice(0, 8)}</td>
                    <td><strong>{v.plateNumber}</strong></td>
                    <td><span className={styles.badge}>{v.type}</span></td>
                    <td><span className={`${styles.status} ${v.status === 'AVAILABLE' ? styles.statusOpen : styles.statusProgress}`}>{v.status}</span></td>
                    <td className={styles.mono} style={{ fontSize: '0.78rem', color: validCoords ? 'inherit' : 'var(--danger)' }}>
                      {validCoords ? `${v.currentLat.toFixed(4)}, ${v.currentLon.toFixed(4)}` : '⚠ Invalid'}
                    </td>
                    <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => { setSelectedVehicle(v); setFormStatus(v.status); setShowStatusModal(true); }}>Status</button>
                      <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => { setSelectedVehicle(v); setFormEditLat(String(v.currentLat)); setFormEditLon(String(v.currentLon)); setShowLocationModal(true); }}>Edit Location</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Vehicle Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Register Vehicle">
        <form onSubmit={handleCreate}>
          <label className="form-label">Plate Number</label>
          <input className="input-field" required value={formPlate} onChange={e => setFormPlate(e.target.value)} placeholder="e.g. AMB-001" />
          <label className="form-label">Vehicle Type</label>
          <select className="input-field" value={formType} onChange={e => setFormType(e.target.value)}>
            <option>AMBULANCE</option><option>FIRE_TRUCK</option><option>POLICE_CAR</option>
          </select>
          <label className="form-label">Station Latitude</label>
          <input className="input-field" type="number" step="any" required value={formLat} onChange={e => setFormLat(e.target.value)} placeholder="e.g. 5.6037" />
          <label className="form-label">Station Longitude</label>
          <input className="input-field" type="number" step="any" required value={formLon} onChange={e => setFormLon(e.target.value)} placeholder="e.g. -0.1870" />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Register</button>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Vehicle Status">
        <form onSubmit={handleUpdateStatus}>
          <label className="form-label">Vehicle: {selectedVehicle?.plateNumber}</label>
          <select className="input-field" value={formStatus} onChange={e => setFormStatus(e.target.value)}>
            {VALID_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Update</button>
        </form>
      </Modal>

      {/* Edit Location Modal */}
      <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} title={`Edit Location — ${selectedVehicle?.plateNumber}`}>
        <form onSubmit={handleUpdateLocation}>
          <label className="form-label">Latitude <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(−90 to 90)</span></label>
          <input className="input-field" type="number" step="any" required value={formEditLat} onChange={e => setFormEditLat(e.target.value)} placeholder="e.g. 5.6037" />
          <label className="form-label">Longitude <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(−180 to 180)</span></label>
          <input className="input-field" type="number" step="any" required value={formEditLon} onChange={e => setFormEditLon(e.target.value)} placeholder="e.g. -0.1870" />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Save Location</button>
        </form>
      </Modal>
    </div>
  );
}
