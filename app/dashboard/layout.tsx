"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className={styles.loader}>Loading...</div>;

  const role = user.role;

  const navLinks = [
    { name: 'Overview', href: '/dashboard', roles: ['ADMIN', 'DISPATCHER', 'HOSPITAL', 'AMBULANCE', 'CITIZEN'] },
    { name: 'Incidents Queue', href: '/dashboard/incidents', roles: ['ADMIN', 'DISPATCHER'] },
    { name: 'Bed Management', href: '/dashboard/hospital', roles: ['ADMIN', 'HOSPITAL'] },
    { name: 'Live Tracking', href: '/dashboard/tracking', roles: ['ADMIN', 'AMBULANCE'] },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>ERS.nano</div>
        <nav className={styles.navMenu}>
          {navLinks.filter(link => link.roles.includes(role)).map((link) => (
            <Link key={link.href} href={link.href} className={styles.navItem}>
              {link.name}
            </Link>
          ))}
        </nav>
        <div className={styles.userControls}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{role}</span>
          </div>
          <button onClick={() => { logout(); router.push('/auth'); }} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Dashboard Overview</h1>
        </header>
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
