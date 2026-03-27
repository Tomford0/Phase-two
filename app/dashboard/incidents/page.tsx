"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Incident {
  id: string;
  title: string;
  type: string;
  status: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  citizenName?: string;
}

export default function IncidentsQueue() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchIncidents() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Dispatchers see open incidents, Admin sees all
        const endpoint = user?.role === 'DISPATCHER' 
          ? 'http://localhost:3000/incidents/open' 
          : 'http://localhost:3000/incidents';
          
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch incidents from API Gateway');
        const data = await res.json();
        setIncidents(data);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchIncidents();
  }, [user]);

  if (!user || !['ADMIN', 'DISPATCHER'].includes(user.role)) {
    return <div>Unauthorized access.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Incidents Queue</h2>
        <button className="btn-primary">New Incident</button>
      </div>
      
      {errorMsg && <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontWeight: 500 }}>{errorMsg}</p>}
      
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading incidents from backend...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={5} style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>No incidents found in the database.</td>
                </tr>
              )}
              {incidents.map(inc => (
                <tr key={inc.id}>
                  <td className={styles.mono}>{inc.id}</td>
                  <td>{inc.title}</td>
                  <td><span className={styles.badge}>{inc.type || 'EMERGENCY'}</span></td>
                  <td>
                    <span className={`${styles.status} ${inc.status === 'OPEN' ? styles.statusOpen : styles.statusProgress}`}>
                      {inc.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      Assign Unit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
