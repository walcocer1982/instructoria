'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'profesor' | 'estudiante'>('estudiante');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = `/api/auth?action=${mode}`;
      const body = mode === 'register'
        ? { nombre, email, password, rol }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Error en la autenticación');
        setLoading(false);
        return;
      }

      // Guardar token en localStorage
      localStorage.setItem('auth_token', result.session.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      // Redirigir según rol
      if (result.user.rol === 'profesor') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }

    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '0.5rem' }}>
            SOPHI
          </h1>
          <p style={{ color: '#718096', fontSize: '0.875rem' }}>
            Sistema Pedagógico Híbrido Inteligente
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '1.5rem',
          background: '#f7fafc',
          borderRadius: '8px',
          padding: '0.25rem',
        }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'login' ? 'white' : 'transparent',
              color: mode === 'login' ? '#667eea' : '#718096',
              fontWeight: mode === 'login' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '6px',
              border: 'none',
              background: mode === 'register' ? 'white' : 'transparent',
              color: mode === 'register' ? '#667eea' : '#718096',
              fontWeight: mode === 'register' ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s',
              boxShadow: mode === 'register' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            Registrarse
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fed7d7',
            color: '#c53030',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#2d3748',
              }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2d3748',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2d3748',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#2d3748',
              }}>
                Rol
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: rol === 'estudiante' ? '2px solid #667eea' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: rol === 'estudiante' ? '#f7fafc' : 'white',
                }}>
                  <input
                    type="radio"
                    name="rol"
                    value="estudiante"
                    checked={rol === 'estudiante'}
                    onChange={() => setRol('estudiante')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Estudiante</span>
                </label>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: rol === 'profesor' ? '2px solid #667eea' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: rol === 'profesor' ? '#f7fafc' : 'white',
                }}>
                  <input
                    type="radio"
                    name="rol"
                    value="profesor"
                    checked={rol === 'profesor'}
                    onChange={() => setRol('profesor')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Profesor</span>
                </label>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#a0aec0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#5a67d8')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#667eea')}
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#a0aec0' }}>
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          {' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.75rem',
            }}
          >
            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}