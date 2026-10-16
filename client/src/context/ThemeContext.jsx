import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const THEMES = [
  {
    id: 'aurora-romantica',
    name: 'Aurora Romântica',
    subtitle: 'Dark Rubi & Dourado Estelar',
    primary: '#F43F5E',
    secondary: '#FBBF24',
    bg: '#0E0B16',
    icon: 'Heart'
  },
  {
    id: 'solaris-luna',
    name: 'Solaris & Luna',
    subtitle: 'Modo Claro Editorial Creme & Terracota (Wattpad)',
    primary: '#E11D48',
    secondary: '#D97706',
    bg: '#FFFDF9',
    icon: 'Sun'
  },
  {
    id: 'cosmos-aveludado',
    name: 'Cosmos Aveludado',
    subtitle: 'Índigo Celestial & Azul Nebulosa',
    primary: '#818CF8',
    secondary: '#38BDF8',
    bg: '#060814',
    icon: 'Planet'
  },
  {
    id: 'jardim-sakura',
    name: 'Jardim de Cerejeira',
    subtitle: 'Sakura Pastel & Folha de Chá',
    primary: '#FB7185',
    secondary: '#34D399',
    bg: '#1A0F16',
    icon: 'FlowerLotus'
  }
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, updateProfile } = useAuth();
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('mary_theme') || 'dark-romantic';
  });

  // Sincroniza com tema do usuário logado se disponível
  useEffect(() => {
    if (user?.theme && user.theme !== theme) {
      setThemeState(user.theme);
      applyThemeToDOM(user.theme);
    }
  }, [user?.theme]);

  // Aplica tema ao DOM e localStorage
  function applyThemeToDOM(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('mary_theme', themeId);
  }

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  async function setTheme(themeId, syncWithBackend = true) {
    setThemeState(themeId);
    applyThemeToDOM(themeId);
    if (syncWithBackend && user && updateProfile) {
      try {
        await updateProfile({ theme: themeId });
      } catch (err) {
        console.warn('Erro ao sincronizar tema no perfil:', err);
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser utilizado dentro de ThemeProvider');
  }
  return ctx;
}
