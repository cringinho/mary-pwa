import React from 'react';
import { Sparkle, ArrowsClockwise } from '@phosphor-icons/react';
import { clearMemoriesCache } from '../services/searchEngine';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovering: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true, recovering: true };
  }

  async componentDidCatch(error, errorInfo) {
    console.warn('[AppErrorBoundary] Recuperando automaticamente de cache inválido:', error, errorInfo);
    await clearMemoriesCache();
    setTimeout(() => {
      this.setState({ hasError: false, recovering: false });
    }, 1000);
  }

  handleManualReset = async () => {
    await clearMemoriesCache();
    this.setState({ hasError: false, recovering: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B090E] text-white p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/20">
            <Sparkle weight="duotone" className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h2 className="text-base font-bold font-display text-white">
              Sincronizando Nosso Universo...
            </h2>
            <p className="text-xs text-pink-200/70 font-sans">
              Limpando cache temporário de memórias para restaurar sua linha do tempo sem desconectar sua conta.
            </p>
          </div>
          <button
            onClick={this.handleManualReset}
            className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-200 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowsClockwise weight="bold" className="w-3.5 h-3.5" />
            <span>Recarregar Agora</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

