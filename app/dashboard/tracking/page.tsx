"use client";

import { useAuth } from '@/context/AuthContext';
import styles from '../incidents/page.module.css';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading Interface...</div>
});

export default function LiveTracking() {
  const { user } = useAuth();

  if (!user || !['ADMIN', 'AMBULANCE'].includes(user.role)) {
    return <div>Unauthorized access.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Unit Live Tracking</h2>
      </div>
      
      <div style={{ height: '600px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <MapComponent />
      </div>
    </div>
  );
}
