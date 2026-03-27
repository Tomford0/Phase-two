"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, Role, User } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('DISPATCHER');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email, password }
        : { name, email, password, role };

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.token) {
        login(data.user, data.token);
        router.push('/dashboard');
      } else {
        setIsLogin(true);
        setError('Registration successful. Please log in.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Failed to fetch') {
        // Fallback mock logic for UI simulation if backend is unavailable
        const mockUser: User = { id: 'mock123', name: name || 'Demo User', email, role: isLogin ? 'ADMIN' : role };
        login(mockUser, 'mock_token_123');
        router.push('/dashboard');
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>ERS.nano</Link>
        <h1 className={styles.title}>{isLogin ? 'Welcome back' : 'Create an account'}</h1>
        <p className={styles.subtitle}>
          {isLogin ? 'Enter your credentials to access the system' : 'Select your role to join the network'}
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <div className={styles.formGroup}>
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div className={styles.formGroup}>
              <label className="form-label">System Role</label>
              <select 
                className="input-field" 
                value={role} 
                onChange={e => setRole(e.target.value as Role)}
              >
                <option value="ADMIN">System Admin</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="AMBULANCE">Ambulance Unit</option>
                <option value="CITIZEN">Citizen</option>
              </select>
            </div>
          </>
        )}

        <div className={styles.formGroup}>
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="input-field" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
        </div>

        <div className={styles.formGroup}>
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="input-field" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
        </button>
      </form>

      <div className={styles.switchText}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <span className={styles.switchLink} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? 'Register now' : 'Sign in instead'}
        </span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
