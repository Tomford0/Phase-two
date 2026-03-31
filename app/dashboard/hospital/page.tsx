"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import styles from '../incidents/page.module.css';

interface Hospital {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  bedTotal?: number;
  bedAvailable: number;
  ambulanceCount: number;
}

export default function HospitalManagement() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateBedModal, setShowUpdateBedModal] = useState(false);
  const [showUpdateAmbModal, setShowUpdateAmbModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLon, setFormLon] = useState('');
  const [formBedTotal, setFormBedTotal] = useState('');
  const [formAmbulanceCount, setFormAmbulanceCount] = useState('');

  // Update forms
  const [formBedAvailable, setFormBedAvailable] = useState('');
  const [formAmbCount, setFormAmbCount] = useState('');

  useEffect(() => { fetchHospitals(); }, []);

  async function fetchHospitals() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/hospitals', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch hospitals');
      setHospitals(await res.json());
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: formName, latitude: parseFloat(formLat), longitude: parseFloat(formLon), bedTotal: parseInt(formBedTotal), ambulanceCount: parseInt(formAmbulanceCount) || 0 })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowCreateModal(false);
      setFormName(''); setFormLat(''); setFormLon(''); setFormBedTotal(''); setFormAmbulanceCount('');
      fetchHospitals();
    } catch (err: any) { alert(err.message); }
  }

  async function handleUpdateBeds(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await fetch(`/api/hospitals/${selectedHospital.id}/beds`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bedAvailable: parseInt(formBedAvailable) })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowUpdateBedModal(false);
      fetchHospitals();
    } catch (err: any) { alert(err.message); }
  }

  async function handleUpdateAmbulances(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedHospital) return;
    try {
      const res = await fetch(`/api/hospitals/${selectedHospital.id}/ambulances`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ambulanceCount: parseInt(formAmbCount) })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowUpdateAmbModal(false);
      fetchHospitals();
    } catch (err: any) { alert(err.message); }
  }

  if (!user || !['ADMIN', 'HOSPITAL'].includes(user.role)) return <div>Unauthorized access.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Hospital Management</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>Add Hospital</button>
      </div>
      {errorMsg && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 500 }}>{errorMsg}</p>}
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Name</th><th>Coordinates</th><th>Beds Available</th><th>Ambulances</th><th>Actions</th></tr></thead>
            <tbody>
              {hospitals.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hospitals found.</td></tr>}
              {hospitals.map(h => (
                <tr key={h.id}>
                  <td className={styles.mono}>{h.id.slice(0, 8)}</td>
                  <td>{h.name}</td>
                  <td>{h.latitude != null ? `${Number(h.latitude).toFixed(5)}, ${Number(h.longitude).toFixed(5)}` : '—'}</td>
                  <td><strong>{h.bedAvailable}</strong></td>
                  <td>{h.ambulanceCount}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => { setSelectedHospital(h); setFormBedAvailable(String(h.bedAvailable)); setShowUpdateBedModal(true); }}>Beds</button>
                    <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => { setSelectedHospital(h); setFormAmbCount(String(h.ambulanceCount)); setShowUpdateAmbModal(true); }}>Ambulances</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Hospital Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Hospital">
        <form onSubmit={handleCreate}>
          <label className="form-label">Hospital Name</label>
          <input className="input-field" required value={formName} onChange={e => setFormName(e.target.value)} />
          <label className="form-label">Latitude</label>
          <input className="input-field" type="number" step="any" required placeholder="e.g. 5.6037" value={formLat} onChange={e => setFormLat(e.target.value)} />
          <label className="form-label">Longitude</label>
          <input className="input-field" type="number" step="any" required placeholder="e.g. -0.1870" value={formLon} onChange={e => setFormLon(e.target.value)} />
          <label className="form-label">Total Beds</label>
          <input className="input-field" type="number" required value={formBedTotal} onChange={e => setFormBedTotal(e.target.value)} />
          <label className="form-label">Ambulance Count</label>
          <input className="input-field" type="number" value={formAmbulanceCount} onChange={e => setFormAmbulanceCount(e.target.value)} />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Add Hospital</button>
        </form>
      </Modal>

      {/* Update Beds Modal */}
      <Modal isOpen={showUpdateBedModal} onClose={() => setShowUpdateBedModal(false)} title="Update Available Beds">
        <form onSubmit={handleUpdateBeds}>
          <label className="form-label">Hospital: {selectedHospital?.name}</label>
          <label className="form-label">Available Beds</label>
          <input className="input-field" type="number" min="0" required value={formBedAvailable} onChange={e => setFormBedAvailable(e.target.value)} />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Update</button>
        </form>
      </Modal>

      {/* Update Ambulances Modal */}
      <Modal isOpen={showUpdateAmbModal} onClose={() => setShowUpdateAmbModal(false)} title="Update Ambulance Count">
        <form onSubmit={handleUpdateAmbulances}>
          <label className="form-label">Hospital: {selectedHospital?.name}</label>
          <label className="form-label">Ambulance Count</label>
          <input className="input-field" type="number" min="0" required value={formAmbCount} onChange={e => setFormAmbCount(e.target.value)} />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Update</button>
        </form>
      </Modal>
    </div>
  );
}
