import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>ERS.nano</div>
        <nav className={styles.nav}>
          <Link href="/auth" className="btn-outline">Sign In</Link>
          <Link href="/auth?mode=register" className="btn-primary">Register</Link>
        </nav>
      </header>
      
      <main className={styles.hero}>
        <h1 className={styles.title}>Rapid Response.<br/>Absolute Clarity.</h1>
        <p className={styles.subtitle}>
          A minimal, unified dashboard for dispatchers, hospitals, ambulances, and administrators to orchestrate emergency scenarios effortlessly.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/auth?mode=register" className="btn-primary">Get Started</Link>
          <Link href="/dashboard" className="btn-outline">View Dashboard</Link>
        </div>
      </main>
    </div>
  );
}