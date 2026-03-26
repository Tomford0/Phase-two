import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>Emergency Response System</h1>

      <p><Link href="/login">Go to Login</Link></p>
      <p><Link href="/dashboard">Go to Dashboard</Link></p>
      <p><Link href="/report">Report Incident</Link></p>
      <p><Link href="/tracking">Tracking</Link></p>
      <p><Link href="/analytics">Analytics</Link></p>
    </div>
  );
}