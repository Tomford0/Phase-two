"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import styles from './page.module.css';

interface Incident {
  id: string;
  title: string;
  type: string;
  status: string;
  citizenName: string;
  latitude: number;
  longitude: number;
  notes?: string;
  assignedUnitId?: string;
}

const VALID_STATUSES = ['OPEN', 'ASSIGNED', 'ENROUTE', 'ARRIVED', 'RESOLVED', 'CLOSED'];

export default function IncidentsQueue() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Create form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('MEDICAL');
  const [formCitizenName, setFormCitizenName] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLon, setFormLon] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Status/Assign fields
  const [formStatus, setFormStatus] = useState('OPEN');
  const [formUnitId, setFormUnitId] = useState('');

  useEffect(() => { fetchIncidents(); }, [user]);

  async function fetchIncidents() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const endpoint = user?.role === 'DISPATCHER' ? '/api/incidents/open' : '/api/incidents';
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch incidents');
      setIncidents(await res.json());
    } catch (err: any) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ title: formTitle, type: formType, citizenName: formCitizenName, latitude: parseFloat(formLat), longitude: parseFloat(formLon), notes: formNotes })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowCreateModal(false);
      resetCreateForm();
      fetchIncidents();
    } catch (err: any) { alert(err.message); }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status: formStatus })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowStatusModal(false);
      fetchIncidents();
    } catch (err: any) { alert(err.message); }
  }

  async function handleAssignUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ assignedUnitId: formUnitId })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      setShowAssignModal(false);
      fetchIncidents();
    } catch (err: any) { alert(err.message); }
  }

  function resetCreateForm() { setFormTitle(''); setFormType('MEDICAL'); setFormCitizenName(''); setFormLat(''); setFormLon(''); setFormNotes(''); }

  if (!user || !['ADMIN', 'DISPATCHER'].includes(user.role)) return <div>Unauthorized access.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Incidents Queue</h2>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>New Incident</button>
      </div>
      {errorMsg && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontWeight: 500 }}>{errorMsg}</p>}
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Title</th><th>Citizen</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {incidents.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No incidents found.</td></tr>}
              {incidents.map(inc => (
                <tr key={inc.id}>
                  <td className={styles.mono}>{inc.id.slice(0, 8)}</td>
                  <td>{inc.title}</td>
                  <td>{inc.citizenName}</td>
                  <td><span className={styles.badge}>{inc.type}</span></td>
                  <td><span className={`${styles.status} ${inc.status === 'OPEN' ? styles.statusOpen : styles.statusProgress}`}>{inc.status}</span></td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    {['ADMIN', 'DISPATCHER'].includes(user?.role ?? '') && (
                      <>
                        <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => { setSelectedIncident(inc); setFormStatus(inc.status); setShowStatusModal(true); }}>Status</button>
                        <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => { setSelectedIncident(inc); setFormUnitId(inc.assignedUnitId || ''); setShowAssignModal(true); }}>Assign</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Incident Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Incident">
        <form onSubmit={handleCreate}>
          <label className="form-label">Title</label>
          <input className="input-field" required value={formTitle} onChange={e => setFormTitle(e.target.value)} />
          <label className="form-label">Citizen Name</label>
          <input className="input-field" required value={formCitizenName} onChange={e => setFormCitizenName(e.target.value)} />
          <label className="form-label">Type</label>
          <select className="input-field" value={formType} onChange={e => setFormType(e.target.value)}>
            <option>MEDICAL</option><option>FIRE</option><option>TRAFFIC</option><option>CRIME</option><option>OTHER</option>
          </select>
          <label className="form-label">Latitude</label>
          <input className="input-field" type="number" step="any" required value={formLat} onChange={e => setFormLat(e.target.value)} />
          <label className="form-label">Longitude</label>
          <input className="input-field" type="number" step="any" required value={formLon} onChange={e => setFormLon(e.target.value)} />
          <label className="form-label">Notes (optional)</label>
          <input className="input-field" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Submit Incident</button>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Status">
        <form onSubmit={handleUpdateStatus}>
          <label className="form-label">Incident: {selectedIncident?.title}</label>
          <select className="input-field" value={formStatus} onChange={e => setFormStatus(e.target.value)}>
            {VALID_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Update</button>
        </form>
      </Modal>

      {/* Assign Unit Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Unit">
        <form onSubmit={handleAssignUnit}>
          <label className="form-label">Incident: {selectedIncident?.title}</label>
          <label className="form-label">Unit ID</label>
          <input className="input-field" required value={formUnitId} onChange={e => setFormUnitId(e.target.value)} placeholder="Enter vehicle/unit ID" />
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Assign</button>
        </form>
      </Modal>
    </div>
  );
}
