"use client";

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import styles from '../incidents/page.module.css';

interface Hospital {
  id: string;
  name: string;
  bedAvailable: number;
  ambulanceCount?: number;
}

export default function HospitalManagement() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('http://localhost:3000/hospitals', {
           headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch hospitals from backend');
        const data = await res.json();
        setHospitals(data);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHospitals();
  }, []);

  if (!user || !['ADMIN', 'HOSPITAL'].includes(user.role)) {
    return <div>Unauthorized access.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Bed & Unit Management</h2>
        {user.role === 'ADMIN' && <button className="btn-primary">Add Hospital</button>}
      </div>
      
      {errorMsg && <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontWeight: 500 }}>{errorMsg}</p>}
      
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading hospital infrastructure data...</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Hospital Name</th>
                <th>Available Beds</th>
                <th>Ambulances</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.length === 0 && (
                <tr>
                   <td colSpan={5} style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>No hospitals found in the database.</td>
                </tr>
              )}
              {hospitals.map(h => (
                <tr key={h.id}>
                  <td className={styles.mono}>{h.id}</td>
                  <td>{h.name || 'Unknown Facility'}</td>
                  <td><strong>{h.bedAvailable || 0}</strong></td>
                  <td>{h.ambulanceCount || 0}</td>
                  <td>
                    <button className="btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      Update Beds
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
