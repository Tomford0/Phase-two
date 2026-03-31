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
  createdAt?: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ incidents: 0, beds: 0, units: 0, health: 'Pending...' });
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Citizen state
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('MEDICAL');
  const [formCitizenName, setFormCitizenName] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLon, setFormLon] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        let incidentsCount = 0;
        let bedsCount = 0;
        let unitsCount = 0;

        if (['ADMIN', 'DISPATCHER'].includes(user.role)) {
           const res = await fetch('/api/incidents/open', { headers });
           if (res.ok) {
              const data = await res.json();
              incidentsCount = Array.isArray(data) ? data.length : 0;
           }
        }

        if (['ADMIN', 'HOSPITAL'].includes(user.role)) {
           const res = await fetch('/api/hospitals', { headers });
           if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                 bedsCount = data.reduce((acc: number, curr: any) => acc + (curr.bedAvailable || 0), 0);
              }
           }
        }

        if (['ADMIN', 'AMBULANCE'].includes(user.role)) {
           const res = await fetch('/api/vehicles', { headers });
           if (res.ok) {
              const data = await res.json();
              unitsCount = Array.isArray(data) ? data.length : 0;
           }
        }

        if (user.role === 'CITIZEN') {
          const res = await fetch('/api/incidents', { headers });
          if (res.ok) {
            setMyIncidents(await res.json());
          }
        }

        setStats({
           incidents: incidentsCount,
           beds: bedsCount,
           units: unitsCount,
           health: '100% OK' 
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
        setStats(s => ({ ...s, health: 'API Offline' }));
        setErrorStatus('Network connection refused (Gateway Offline).');
      }
    }
    fetchStats();
  }, [user]);

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setReportError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: formTitle,
          type: formType,
          citizenName: formCitizenName,
          latitude: parseFloat(formLat),
          longitude: parseFloat(formLon),
          notes: formNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit report');
      setMyIncidents(prev => [data, ...prev]);
      setShowReportModal(false);
      setFormTitle(''); setFormType('MEDICAL'); setFormCitizenName(''); setFormLat(''); setFormLon(''); setFormNotes('');
    } catch (err: any) {
      setReportError(err.message);
    }
  }
  
  if (!user) return null;

  if (user.role === 'CITIZEN') {
    return (
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.25rem' }}>Welcome, {user.name}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Use this portal to report emergencies and track your submitted reports.</p>

        <button className="btn-primary" style={{ marginBottom: '1.5rem' }} onClick={() => setShowReportModal(true)}>
          + Report an Emergency
        </button>

        <h3 style={{ marginBottom: '1rem' }}>My Submitted Reports</h3>
        {myIncidents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No reports submitted yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Title</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Type</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {myIncidents.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem 0.75rem' }}>{inc.title}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>{inc.type}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: inc.status === 'OPEN' ? 'var(--warning-light, #fef3c7)' : 'var(--success-light, #d1fae5)',
                      color: inc.status === 'OPEN' ? '#92400e' : '#065f46',
                    }}>{inc.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report an Emergency">
          <form onSubmit={handleReport}>
            {reportError && <p style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>{reportError}</p>}
            <label className="form-label">Your Name</label>
            <input className="input-field" required value={formCitizenName} onChange={e => setFormCitizenName(e.target.value)} />
            <label className="form-label">Incident Title</label>
            <input className="input-field" required value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Car accident on Main St" />
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
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Submit Report</button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.welcome}>Welcome back, {user.name}</h2>
      {errorStatus && <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontWeight: 500 }}>{errorStatus}</p>}
      
      <div className={styles.grid}>
        {['ADMIN', 'DISPATCHER'].includes(user.role) && (
          <div className={styles.card}>
            <h3>Active Incidents</h3>
            <div className={styles.stat}>{stats.incidents}</div>
            <p className={styles.desc}>Open emergencies currently registered via API.</p>
          </div>
        )}
        
        {['ADMIN', 'HOSPITAL'].includes(user.role) && (
          <div className={styles.card}>
            <h3>Available Beds</h3>
            <div className={styles.stat}>{stats.beds}</div>
            <p className={styles.desc}>Intensive care and ward capacity sum from backend.</p>
          </div>
        )}
        
        {['ADMIN', 'AMBULANCE'].includes(user.role) && (
          <div className={styles.card}>
            <h3>Registered Units</h3>
            <div className={styles.stat}>{stats.units}</div>
            <p className={styles.desc}>Ambulances connected active over the network.</p>
          </div>
        )}

        {['ADMIN'].includes(user.role) && (
          <div className={styles.card}>
            <h3>System Health</h3>
            <div className={styles.stat} style={{ color: stats.health === '100% OK' ? 'var(--text-color)' : 'var(--danger)' }}>{stats.health}</div>
            <p className={styles.desc}>Real-time status check payload.</p>
          </div>
        )}
      </div>
    </div>
  );
}