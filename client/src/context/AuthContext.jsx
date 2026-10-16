import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.couple) setCouple(data.couple);
        } else {
          setUser(null);
          setCouple(null);
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  async function login(username, password) {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas');
      }
      setUser(data.user);
      if (data.couple) setCouple(data.couple);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function register(payload) {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar conta');
      }
      setUser(data.user);
      if (data.couple) setCouple(data.couple);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Erro ao fazer logout:', err);
    } finally {
      setUser(null);
      setCouple(null);
    }
  }

  async function updateProfile(fields) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(fields)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao atualizar perfil');
    }
    setUser(data.user);
    return data.user;
  }

  async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao enviar foto de perfil');
    }
    setUser(data.user);
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        couple,
        setCouple,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return ctx;
}
