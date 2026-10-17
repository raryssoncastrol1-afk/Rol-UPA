import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[45vh] p-8 text-center bg-white dark:bg-[#18221D] rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs my-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] mb-2">
            {this.props.fallbackTitle || 'Não foi possível carregar este módulo'}
          </h3>
          <p className="text-[#5C665F] dark:text-[#8A968F] text-xs max-w-md mb-5 leading-relaxed">
            Ocorreu uma inconsistência temporária ao carregar esta seção. Você pode tentar recarregar o módulo abaixo.
          </p>
          {this.state.error && (
            <div className="bg-[#FAF8F5] dark:bg-[#111614] text-[#5C665F] dark:text-[#8A968F] text-xs font-mono p-3 rounded-xl mb-5 max-w-lg overflow-x-auto text-left border border-[#E4DFD5] dark:border-[#2A3A31]">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-white dark:text-[#111614] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Recarregar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

