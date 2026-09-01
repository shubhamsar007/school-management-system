'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = React.useState('admin@sunriseschool.edu.in');
  const [password, setPassword] = React.useState('Admin@1234');
  const [error, setError]       = React.useState('');
  const [loading, setLoading]   = React.useState(false);

  // If already signed in, skip the login page
  React.useEffect(() => {
    if (localStorage.getItem('access_token')) {
      router.replace('/students');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error?.message ?? 'Invalid email or password');
        return;
      }

      localStorage.setItem('access_token', json.data.accessToken);
      router.push('/students');
    } catch {
      setError('Could not connect to server. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f4f0',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e6e8eb',
        padding: '36px 32px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-fraunces, serif)',
          fontSize: 26,
          fontWeight: 600,
          color: '#2c322f',
          marginBottom: 6,
        }}>
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: '#8a929b', marginBottom: 28 }}>
          School Management System
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7480', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d8dde3',
                fontSize: 14,
                color: '#14181c',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7480', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #d8dde3',
                fontSize: 14,
                color: '#14181c',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#b3261e', background: '#fef2f2', borderRadius: 8, padding: '10px 12px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '11px',
              borderRadius: 8,
              background: loading ? '#a0b5a8' : '#2e6644',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
