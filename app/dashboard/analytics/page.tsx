"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import styles from '../incidents/page.module.css';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [responseTimes, setResponseTimes] = useState<any>(null);
  const [regions, setRegions] = useState<any>(null);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [rtRes, rgRes, utRes] = await Promise.all([
          fetch('/api/analytics/response-times', { headers }),
          fetch('/api/analytics/incidents-by-region', { headers }),
          fetch('/api/analytics/resource-utilization', { headers }),
        ]);

        if (rtRes.ok) setResponseTimes(await rtRes.json());
        if (rgRes.ok) setRegions(await rgRes.json());
        if (utRes.ok) setUtilization(await utRes.json());
      } catch (err) {
        console.error('Analytics fetch error', err);
      } finally { setLoading(false); }
    }
    fetchAnalytics();
  }, []);

  if (!user || user.role !== 'ADMIN') return <div>Unauthorized access.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>System Analytics</h2></div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Response Times */}
          <div style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>Response Times</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px' }}>
              {responseTimes ? `${Math.round(responseTimes.averageResponseTimeMs)}ms` : '—'}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Average across {responseTimes?.totalIncidentsAssigned || 0} assigned incidents
            </p>
          </div>

          {/* Incidents by Region */}
          <div style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>Incidents by Region</h3>
            {regions && Object.keys(regions).length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.entries(regions).map(([key, count]) => (
                  <li key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span>Region {key}</span>
                    <strong>{count as number}</strong>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--text-muted)' }}>No regional data available yet.</p>}
          </div>

          {/* Resource Utilization */}
          <div style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>Resource Utilization</h3>
            {utilization.length > 0 ? (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {utilization.map((item, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{item.vehicleId?.slice(0, 8) || `Unit ${i + 1}`}</span>
                    <strong>{item.totalDispatches} dispatches</strong>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--text-muted)' }}>No utilization data available yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
