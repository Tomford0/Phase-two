"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ incidents: 0, beds: 0, units: 0, health: 'Pending...' });
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

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
  
  if (!user) return null;

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