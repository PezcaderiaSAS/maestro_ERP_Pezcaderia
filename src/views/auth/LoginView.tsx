import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { authService } from '../../services/authService';
import type { SesionActiva } from '../../types/auth.types';

interface LoginViewProps {
  onLoginSuccess: (sesion: SesionActiva) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await authService.login(usuario, password);
    if (res.error || !res.data) {
      setError(res.error || 'Error al iniciar sesión');
      setLoading(false);
      return;
    }

    onLoginSuccess(res.data);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f1f5f9'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-color)' }}>
            La Pezcadería ERP
          </h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px', boxSizing: 'border-box' }}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ display: 'block', marginBottom: '4px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingLeft: '38px', paddingRight: '38px', boxSizing: 'border-box' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};
